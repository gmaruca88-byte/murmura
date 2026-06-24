"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const KINDS = ["Serata in discoteca", "Festa privata", "Concerto", "Aperitivo / Bar", "Festival", "Altro"];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState(null); // create | join | manage
  const [name, setName] = useState("");
  const [kind, setKind] = useState(KINDS[0]);
  const [code, setCode] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [err, setErr] = useState("");

  const create = async () => {
    if (!name.trim()) return setErr("Dai un nome al muro");
    setBusy(true); setErr("");
    const res = await fetch("/api/walls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, kind }) });
    const j = await res.json(); setBusy(false);
    if (!res.ok) return setErr(j.error || "Errore");
    // ricorda la chiave su questo dispositivo (comodità organizzatore)
    try { const ks = JSON.parse(localStorage.getItem("spotcrushh:keys") || "{}"); ks[j.code] = j.owner_key; localStorage.setItem("spotcrushh:keys", JSON.stringify(ks)); } catch {}
    setCreated(j);
  };
  const join = () => { if (code.trim()) router.push("/w/" + code.trim().toUpperCase()); };
  const manage = () => { if (code.trim() && key.trim()) router.push(`/w/${code.trim().toUpperCase()}/admin?key=${encodeURIComponent(key.trim())}`); };

  return (
    <main className="home">
      <section>
        <p className="eyebrow">il muro anonimo del tuo evento</p>
        <h1 className="display">Le voci della serata,<br /><span className="glow">in tempo reale.</span></h1>
        <p className="lede">Chi entra scrive in anonimo. Flirta, commenta, rispondi — senza rivelare chi sei.</p>

        {!created && (
          <div className="cta-row">
            <button className="btn primary" onClick={() => { setMode("create"); setErr(""); }}>Crea un muro</button>
            <button className="btn ghost" onClick={() => { setMode(mode === "join" ? null : "join"); setErr(""); }}>Ho un codice</button>
            <button className="btn ghost" onClick={() => { setMode(mode === "manage" ? null : "manage"); setErr(""); }}>Sono l'organizzatore</button>
          </div>
        )}

        {mode === "create" && !created && (
          <div className="result">
            <label className="lab">Nome dell'evento</label>
            <input className="in big" placeholder="es. Sabato @ Club Neon" value={name} onChange={e => setName(e.target.value)} />
            <label className="lab">Tipo</label>
            <div className="chips">{KINDS.map(k => <button key={k} className={"chip" + (kind === k ? " on" : "")} onClick={() => setKind(k)}>{k}</button>)}</div>
            <button className="btn primary wide" disabled={busy} onClick={create}>{busy ? "Creo…" : "Genera muro e link"}</button>
          </div>
        )}

        {mode === "join" && (
          <div className="joinbox">
            <input className="in" placeholder="CODICE MURO" value={code} onChange={e => setCode(e.target.value)} />
            <button className="btn primary" onClick={join}>Entra</button>
          </div>
        )}
        {mode === "manage" && (
          <div className="joinbox">
            <input className="in" placeholder="CODICE" value={code} onChange={e => setCode(e.target.value)} />
            <input className="in" placeholder="CHIAVE ORGANIZZATORE" value={key} onChange={e => setKey(e.target.value)} />
            <button className="btn primary" onClick={manage}>Apri pannello</button>
          </div>
        )}

        {created && (
          <div className="result">
            <h3 className="display sm">Muro creato 🎉</h3>
            <p className="lab">Codice (condividilo)</p><code className="codebig">{created.code}</code>
            <p className="lab">Chiave organizzatore (tienila privata)</p><code className="codebig key">{created.owner_key}</code>
            <p className="lab">Link da condividere</p><code style={{ color: "var(--viol)", wordBreak: "break-all" }}>{created.link}</code>
            <div className="cta-row" style={{ marginTop: 16 }}>
              <button className="btn primary" onClick={() => router.push(`/w/${created.code}/admin?key=${encodeURIComponent(created.owner_key)}`)}>Apri il pannello</button>
              <button className="btn ghost" onClick={() => router.push(`/w/${created.code}`)}>Vedi il muro</button>
            </div>
            <p className="hint">Salva la chiave: serve per rientrare nel pannello.</p>
          </div>
        )}

        {err && <p className="hint" style={{ color: "var(--pink)" }}>{err}</p>}
      </section>
    </main>
  );
}
