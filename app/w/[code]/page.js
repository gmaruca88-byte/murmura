"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Bubble, AdRail, PromoCard, DOTS } from "../../ui";

function getAlias() {
  try {
    const a = JSON.parse(localStorage.getItem("murmura:alias") || "null");
    if (a) return a;
  } catch {}
  const alias = { name: "Anon·" + Math.random().toString(36).slice(2, 5).toUpperCase(), color: DOTS[Math.floor(Math.random() * DOTS.length)] };
  try { localStorage.setItem("murmura:alias", JSON.stringify(alias)); } catch {}
  return alias;
}

export default function WallPage() {
  const { code } = useParams();
  const [wall, setWall] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [text, setText] = useState("");
  const [alias, setAlias] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  const [notfound, setNotfound] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { setAlias(getAlias()); }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  const loadMeta = useCallback(async () => {
    const r = await fetch(`/api/walls/${code}`);
    if (!r.ok) { setNotfound(true); return; }
    setWall(await r.json());
  }, [code]);

  const load = useCallback(async () => {
    const r = await fetch(`/api/walls/${code}/messages`);
    if (!r.ok) return;
    const j = await r.json();
    setMsgs(j.messages || []);
    setAnalysis(j.analysis || null);
  }, [code]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { load(); const i = setInterval(load, 4000); return () => clearInterval(i); }, [load]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true); setText("");
    const r = await fetch(`/api/walls/${code}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t, alias: alias?.name, color: alias?.color }),
    });
    const j = await r.json(); setSending(false);
    if (j.blocked) flash("Messaggio bloccato dall'AI: " + (j.reason || "non consentito"));
    else { await load(); setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60); }
  };

  const like = async (id) => {
    setMsgs(ms => ms.map(m => m.id === id ? { ...m, likes: (m.likes || 0) + 1 } : m));
    await fetch(`/api/walls/${code}/like`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
  };

  if (notfound) return <main className="center"><h2 className="display sm">Muro non trovato</h2><p className="muted">Controlla il codice o il link. <a href="/" style={{ color: "var(--viol)" }}>Torna alla home</a></p></main>;
  if (!wall) return <main className="center"><p className="muted">Carico il muro…</p></main>;

  const sections = analysis?.sections?.length
    ? analysis.sections.map(s => ({ ...s, items: msgs.filter(m => s.ids?.includes(m.id)) })).filter(s => s.items.length)
    : null;
  const ungrouped = sections ? msgs.filter(m => !sections.some(s => s.ids?.includes(m.id))) : null;

  return (
    <main className="wall-layout">
      <AdRail side="left" />
      <div className="wall">
        <div className="wall-top">
          <div><h2 className="display sm">{wall.name}</h2><span className="muted">{wall.kind} · {msgs.length} messaggi</span></div>
          <span className="live"><span className="pulse" />LIVE</span>
        </div>
        <PromoCard />
        <div className="feed">
          {msgs.length === 0 && <div className="empty">Ancora silenzio. Rompi il ghiaccio — scrivi qualcosa. 🎶</div>}
          {sections ? (
            <>
              {sections.map((s, i) => (
                <div key={i} className="sec">
                  <div className="sec-head"><span>{s.emoji}</span>{s.title}<span className="sec-n">{s.items.length}</span></div>
                  {s.items.map(m => <Bubble key={m.id} m={m} onLike={like} />)}
                </div>
              ))}
              {ungrouped?.length > 0 && (
                <div className="sec">
                  <div className="sec-head"><span>💬</span>Altro<span className="sec-n">{ungrouped.length}</span></div>
                  {ungrouped.map(m => <Bubble key={m.id} m={m} onLike={like} />)}
                </div>
              )}
            </>
          ) : msgs.map(m => <Bubble key={m.id} m={m} onLike={like} />)}
          <div ref={endRef} />
        </div>
        <div className="composer">
          {alias && <div className="alias"><span className="adot" style={{ background: alias.color }} />{alias.name}</div>}
          <textarea className="cin" rows={1} placeholder="Scrivi in anonimo…" value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn primary" disabled={sending} onClick={send}>{sending ? "…" : "Invia"}</button>
        </div>
      </div>
      <AdRail side="right" />
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
