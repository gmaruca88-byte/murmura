// =====================================================================
//  Gemini layer — moderazione + analisi.
//  Free tier: usa modelli Flash/Flash-Lite (Pro è a pagamento dal 2026).
//  Endpoint REST v1beta. Retry con backoff sui 429 (rate limit).
// =====================================================================
const KEY = process.env.GEMINI_API_KEY;
const MOD_MODEL = process.env.GEMINI_MODERATION_MODEL || "gemini-2.5-flash-lite";
const ANA_MODEL = process.env.GEMINI_ANALYSIS_MODEL || "gemini-2.5-flash";
const FAIL_OPEN = (process.env.MODERATION_FAIL_MODE || "open") !== "closed";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gemini(model, system, user, retries = 3) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });
    if (res.status === 429) { await sleep(2 ** i * 800 + Math.random() * 400); continue; }
    if (!res.ok) throw new Error("gemini_" + res.status);
    const data = await res.json();
    return (data?.candidates?.[0]?.content?.parts || []).map((p) => p.text).join("");
  }
  throw new Error("rate_limited");
}
function parse(t) {
  try { return JSON.parse(t); }
  catch {
    const s = t.indexOf("{"), e = t.lastIndexOf("}");
    return JSON.parse(t.slice(s, e + 1));
  }
}

const MOD_SYS =
  "Sei il moderatore di una bacheca anonima per eventi (discoteche, party). " +
  "Valuti UN messaggio. Blocca SOLO contenuti illegali o gravemente dannosi: " +
  "minacce credibili, incitamento all'odio/violenza, contenuti sessuali su minori, " +
  "doxxing/dati personali di terzi, vendita di droga/armi, spam evidente. " +
  "Linguaggio colorito, flirt, critiche aspre e volgarità lievi sono AMMESSI. " +
  "Rispondi in JSON: {\"decision\":\"allow\"|\"block\",\"category\":\"tema breve in italiano\",\"sentiment\":\"pos\"|\"neu\"|\"neg\",\"reason\":\"motivo breve\"}";

export async function moderate(text) {
  try {
    const j = parse(await gemini(MOD_MODEL, MOD_SYS, `Messaggio: """${text}"""`));
    return {
      decision: j.decision === "block" ? "block" : "allow",
      category: j.category || "Generale",
      sentiment: ["pos", "neu", "neg"].includes(j.sentiment) ? j.sentiment : "neu",
      reason: j.reason || "",
      needs_review: false,
    };
  } catch (e) {
    // Fail-safe: se l'AI è giù o rate-limited non blocchiamo l'evento.
    return {
      decision: FAIL_OPEN ? "allow" : "block",
      category: "Da rivedere",
      sentiment: "neu",
      reason: "AI non disponibile (" + e.message + ")",
      needs_review: true,
    };
  }
}

const ANA_SYS =
  "Sei l'analista AI di una bacheca anonima di un evento. Ricevi messaggi anonimi. " +
  "1) Raggruppa TUTTI gli id in 2-5 sezioni a tema con titolo breve e accattivante + emoji. " +
  "2) Crea un report per l'organizzatore, in italiano. Rispondi in JSON: " +
  "{\"sections\":[{\"title\":\"...\",\"emoji\":\"...\",\"ids\":[1,2]}]," +
  "\"report\":{\"mood\":\"frase sul clima\",\"sentiment\":{\"pos\":0,\"neu\":0,\"neg\":0}," +
  "\"themes\":[\"...\"],\"criticisms\":[\"...\"],\"highlights\":[\"...\"],\"suggestions\":[\"...\"]}}";

export async function analyze(messages) {
  const list = messages.map((m) => `#${m.id}: ${m.text}`).join("\n").slice(0, 12000);
  const j = parse(await gemini(ANA_MODEL, ANA_SYS, `Messaggi:\n${list}`));
  return { sections: j.sections || [], report: j.report || {} };
}
