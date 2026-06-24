"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Bubble, Stat, Bar, RepBlock, fmt } from "../../../ui";

function Dashboard() {
  const { code } = useParams();
  const params = useSearchParams();
  const key = params.get("key") || "";
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("report");
  const [toast, setToast] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  const load = useCallback(async () => {
    const r = await fetch(`/api/walls/${code}/admin?key=${encodeURIComponent(key)}`);
    if (!r.ok) { setErr(r.status === 401 ? "Chiave organizzatore errata." : "Muro non trovato."); return; }
    setErr(""); setData(await r.json());
  }, [code, key]);

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);

  const analyze = async () => {
    setBusy(true);
    const r = await fetch(`/api/walls/${code}/analyze`, { method: "POST", headers: { "x-owner-key": key } });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return flash(j.error || "Errore");
    flash("Report aggiornato"); load();
  };

  const copyLink = () => {
    const link = `${window.location.origin}/w/${code}`;
    navigator.clipboard?.writeText(link); flash("Link copiato: " + link);
  };

  if (err) return <main className="center"><h2 className="display sm">Accesso negato</h2><p className="muted">{err} <a href="/" style={{ color: "var(--viol)" }}>Home</a></p></main>;
  if (!data) return <main className="center"><p className="muted">Carico il pannello…</p></main>;

  const live = data.messages.filter(m => m.status === "live");
  const blocked = data.messages.filter(m => m.status === "blocked");
  const review = data.messages.filter(m => m.needs_review);
  const rep = data.analysis?.data?.report;
  const sent = rep?.sentiment || live.reduce((a, m) => { a[m.sentiment || "neu"] = (a[m.sentiment || "neu"] || 0) + 1; return a; }, {});
  const tot = (sent.pos || 0) + (sent.neu || 0) + (sent.neg || 0);

  return (
    <main className="dash">
      <div className="dash-head">
        <div><h2 className="display sm">Pannello organizzatore</h2><span className="muted">{data.wall.name}</span></div>
        <div className="dash-actions">
          <a className="btn ghost" href={`/w/${code}`}>Vedi il muro</a>
          <button className="btn primary" disabled={busy} onClick={analyze}>{busy ? "Analizzo…" : "Aggiorna report AI"}</button>
        </div>
      </div>

      <div className="share">
        <div><span className="lab">Codice</span><code className="codebig">{code}</code></div>
        <button className="btn ghost" onClick={copyLink}>Copia link</button>
      </div>

      <div className="stats">
        <Stat n={live.length} l="Messaggi" />
        <Stat n={blocked.length} l="Bloccati AI" />
        <Stat n={live.reduce((a, m) => a + (m.likes || 0), 0)} l="🔥 totali" />
        <Stat n={data.analysis?.data?.sections?.length || 0} l="Sezioni" />
      </div>

      <div className="tabs">
        {["report", "muro", "moderazione", "pubblicità"].map(t => <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "report" && (
        <div className="panel">
          {!rep && <div className="empty">Premi “Aggiorna report AI” per generare l'analisi della serata.</div>}
          {rep && <>
            <div className="mood">“{rep.mood}”</div>
            <div className="senti">
              <Bar label="Positivi" v={sent.pos || 0} tot={tot} c="#3DECC8" />
              <Bar label="Neutri" v={sent.neu || 0} tot={tot} c="#8B5CFF" />
              <Bar label="Negativi" v={sent.neg || 0} tot={tot} c="#FF3D7F" />
            </div>
            <RepBlock title="🔥 Momenti top" items={rep.highlights} />
            <RepBlock title="⚠️ Critiche da ascoltare" items={rep.criticisms} accent />
            <RepBlock title="🧭 Temi della serata" items={rep.themes} />
            <RepBlock title="💡 Consigli AI" items={rep.suggestions} />
            <p className="hint">Generato {data.analysis?.generated_at ? fmt(data.analysis.generated_at) : ""} · visibile solo a te</p>
          </>}
        </div>
      )}

      {tab === "muro" && (
        <div className="panel feed">
          {live.length === 0 && <div className="empty">Nessun messaggio.</div>}
          {live.map(m => <Bubble key={m.id} m={m} />)}
        </div>
      )}

      {tab === "moderazione" && (
        <div className="panel">
          {review.length > 0 && <p className="hint" style={{ color: "var(--amber)" }}>{review.length} messaggi pubblicati ma non verificati dall'AI (rate limit): controllali.</p>}
          {blocked.length === 0 && review.length === 0 && <div className="empty">Nessun messaggio bloccato. 🛡️</div>}
          {blocked.map(m => (
            <div key={m.id} className="modrow">
              <div className="bub-text">{m.text}</div>
              <div className="modmeta">Bloccato · {m.reason || m.category} · {fmt(m.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "pubblicità" && (
        <div className="panel">
          <p className="muted">Inventario spazi di questo muro (modello di ricavo).</p>
          <div className="inv">
            {[["Banner laterale sx", "160×600", "€80 / serata"], ["Banner laterale dx", "160×600", "€80 / serata"], ["Evento promosso (feed)", "card", "€150 / serata"], ["Takeover sezione AI", "—", "€220 / serata"]]
              .map((r, i) => <div key={i} className="invrow"><span>{r[0]}</span><span className="muted">{r[1]}</span><span className="price">{r[2]}</span><button className="btn ghost xs">Vendi</button></div>)}
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<main className="center"><p className="muted">…</p></main>}><Dashboard /></Suspense>;
}
