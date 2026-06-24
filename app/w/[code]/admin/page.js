"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Bubble, Stat, Bar, RepBlock, fmt } from "../../../ui";

const STOP = new Set("di a da in con su per tra fra il lo la i gli le un uno una e o ma se che chi cui non più mi ti si ci vi ne lo la è ho ha hai del della dei delle al alla allo dal sul col come quando dove tutto tutti questa questo sono anche solo già qui qua poi".split(" "));

function topWords(messages, n = 20) {
  const c = {};
  messages.forEach(m => (m.text.toLowerCase().match(/[a-zàèéìòù]{3,}/g) || []).forEach(w => { if (!STOP.has(w)) c[w] = (c[w] || 0) + 1; }));
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function Dashboard() {
  const { code } = useParams();
  const key = useSearchParams().get("key") || "";
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("report");
  const [toast, setToast] = useState(null);
  const [q, setQ] = useState("");
  const [sp, setSp] = useState({ slot: "feed", title: "", subtitle: "", link: "" });
  const [file, setFile] = useState(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  const load = useCallback(async () => {
    const r = await fetch(`/api/walls/${code}/admin?key=${encodeURIComponent(key)}`);
    if (!r.ok) { setErr(r.status === 401 ? "Chiave organizzatore errata." : "Muro non trovato."); return; }
    setErr(""); setData(await r.json());
  }, [code, key]);
  useEffect(() => { load(); const i = setInterval(load, 6000); return () => clearInterval(i); }, [load]);

  const analyze = async () => {
    setBusy(true);
    const r = await fetch(`/api/walls/${code}/analyze`, { method: "POST", headers: { "x-owner-key": key } });
    const j = await r.json(); setBusy(false);
    flash(r.ok ? "Report aggiornato" : (j.error || "Errore")); load();
  };

  const del = async (id) => {
    if (!confirm("Cancellare questo messaggio?")) return;
    await fetch(`/api/walls/${code}/messages/${id}?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    flash("Messaggio cancellato"); load();
  };

  const addSponsor = async () => {
    const fd = new FormData();
    fd.append("owner_key", key); fd.append("slot", sp.slot);
    fd.append("title", sp.title); fd.append("subtitle", sp.subtitle); fd.append("link", sp.link);
    if (file) fd.append("image", file);
    const r = await fetch(`/api/walls/${code}/sponsors`, { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) return flash(j.error || "Errore");
    setSp({ slot: "feed", title: "", subtitle: "", link: "" }); setFile(null);
    flash("Sponsor aggiunto"); load();
  };
  const delSponsor = async (id) => {
    await fetch(`/api/walls/${code}/sponsors?id=${id}&key=${encodeURIComponent(key)}`, { method: "DELETE" });
    flash("Sponsor rimosso"); load();
  };

  const copyLink = () => { const link = `${window.location.origin}/w/${code}`; navigator.clipboard?.writeText(link); flash("Link copiato"); };

  if (err) return <main className="center"><h2 className="display sm">Accesso negato</h2><p className="muted">{err} <a href="/" style={{ color: "var(--viol)" }}>Home</a></p></main>;
  if (!data) return <main className="center"><p className="muted">Carico il pannello…</p></main>;

  const live = data.messages.filter(m => m.status === "live");
  const tops = live.filter(m => !m.parent_id);
  const repliesOf = (id) => live.filter(m => m.parent_id === id);
  const blocked = data.messages.filter(m => m.status === "blocked");
  const review = data.messages.filter(m => m.needs_review && m.status === "live");
  const rep = data.analysis?.data?.report;
  const sent = rep?.sentiment || live.reduce((a, m) => { a[m.sentiment || "neu"] = (a[m.sentiment || "neu"] || 0) + 1; return a; }, {});
  const tot = (sent.pos || 0) + (sent.neu || 0) + (sent.neg || 0);
  const words = topWords(live);
  const found = q.trim() ? live.filter(m => m.text.toLowerCase().includes(q.trim().toLowerCase())) : [];

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
        <Stat n={tops.length} l="Messaggi" />
        <Stat n={live.length - tops.length} l="Risposte" />
        <Stat n={live.reduce((a, m) => a + (m.likes || 0), 0)} l="🔥 totali" />
        <Stat n={blocked.length} l="Bloccati" />
      </div>

      <div className="tabs">
        {["report", "muro", "ricerca", "moderazione", "sponsor"].map(t => <button key={t} className={"tab" + (tab === t ? " on" : "")} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "report" && (
        <div className="panel">
          {!rep && <div className="empty">Premi “Aggiorna report AI” per generare l'analisi.</div>}
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
          </>}
        </div>
      )}

      {tab === "muro" && (
        <div className="panel feed">
          {tops.length === 0 && <div className="empty">Nessun messaggio.</div>}
          {tops.map(m => <Bubble key={m.id} m={m} replies={repliesOf(m.id)} admin onDelete={del} />)}
        </div>
      )}

      {tab === "ricerca" && (
        <div className="panel">
          <span className="lab">Parole più usate</span>
          <div className="chips" style={{ marginBottom: 16 }}>
            {words.length === 0 && <span className="muted">Nessun dato.</span>}
            {words.map(([w, n]) => <button key={w} className="chip" onClick={() => setQ(w)}>{w} · {n}</button>)}
          </div>
          <span className="lab">Cerca nei messaggi</span>
          <input className="in" placeholder="scrivi una parola…" value={q} onChange={e => setQ(e.target.value)} />
          <div className="feed" style={{ marginTop: 14 }}>
            {q.trim() && found.length === 0 && <div className="empty">Nessun risultato.</div>}
            {found.map(m => <Bubble key={m.id} m={m} admin onDelete={del} />)}
          </div>
        </div>
      )}

      {tab === "moderazione" && (
        <div className="panel">
          {review.length > 0 && <p className="hint" style={{ color: "var(--amber)" }}>{review.length} messaggi pubblicati ma non verificati dall'AI: controllali nel muro.</p>}
          {blocked.length === 0 && <div className="empty">Nessun messaggio bloccato. 🛡️</div>}
          {blocked.map(m => (
            <div key={m.id} className="modrow">
              <div className="bub-text">{m.text}</div>
              <div className="modmeta">Bloccato · {m.reason || m.category} · {fmt(m.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "sponsor" && (
        <div className="panel">
          <span className="lab">Aggiungi sponsor / evento promosso</span>
          <div className="chips" style={{ margin: "8px 0" }}>
            {[["feed", "Nel feed (evento promosso)"], ["left", "Banner sinistra"], ["right", "Banner destra"]].map(([v, l]) =>
              <button key={v} className={"chip" + (sp.slot === v ? " on" : "")} onClick={() => setSp({ ...sp, slot: v })}>{l}</button>)}
          </div>
          <input className="in big" placeholder="Titolo (es. Venerdì — Rooftop Session)" value={sp.title} onChange={e => setSp({ ...sp, title: e.target.value })} style={{ marginBottom: 8 }} />
          <input className="in big" placeholder="Sottotitolo (facoltativo)" value={sp.subtitle} onChange={e => setSp({ ...sp, subtitle: e.target.value })} style={{ marginBottom: 8 }} />
          <input className="in big" placeholder="Link (https://…)" value={sp.link} onChange={e => setSp({ ...sp, link: e.target.value })} style={{ marginBottom: 8 }} />
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ color: "var(--mut)", marginBottom: 12 }} />
          <button className="btn primary wide" onClick={addSponsor}>Carica sponsor</button>

          <span className="lab" style={{ marginTop: 22 }}>Sponsor attivi</span>
          {(!data.sponsors || data.sponsors.length === 0) && <div className="empty">Nessuno sponsor.</div>}
          {(data.sponsors || []).map(s => (
            <div key={s.id} className="invrow" style={{ gridTemplateColumns: "auto 1fr auto" }}>
              {s.image_url ? <img src={s.image_url} alt="" style={{ width: 46, height: 46, objectFit: "cover", borderRadius: 8 }} /> : <div className="promo-thumb">🎟️</div>}
              <span>{s.title || "(senza titolo)"} <span className="muted">· {s.slot}</span></span>
              <button className="btn ghost xs" onClick={() => delSponsor(s.id)}>Rimuovi</button>
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

export default function AdminPage() {
  return <Suspense fallback={<main className="center"><p className="muted">…</p></main>}><Dashboard /></Suspense>;
}
