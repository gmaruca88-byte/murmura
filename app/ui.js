"use client";
import React, { useState } from "react";

export const DOTS = ["#FF3D7F", "#8B5CFF", "#3DECC8", "#FFB23D", "#5BC0FF", "#FF7A59"];
export const fmt = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

// ---- Bolla messaggio con risposte, fiamma (un voto), risposta, e (admin) cancella ----
export function Bubble({ m, replies = [], likedSet, onLike, onReply, admin, onDelete }) {
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const liked = likedSet?.has(m.id);

  const submit = async () => {
    if (!txt.trim() || busy) return;
    setBusy(true);
    const ok = await onReply(m.id, txt.trim());
    setBusy(false);
    if (ok) { setTxt(""); setOpen(false); }
  };

  return (
    <div className="bub">
      <div className="bub-head">
        <span className="adot" style={{ background: m.color }} />{m.alias}
        <span className="bub-time">{fmt(m.created_at)}</span>
        {admin && <button className="del" title="Cancella" onClick={() => onDelete(m.id)}>🗑</button>}
      </div>
      <p className="bub-text">{m.text}</p>
      <div className="bub-actions">
        {onLike && <button className={"likebtn" + (liked ? " on" : "")} disabled={liked} onClick={() => onLike(m.id)}>🔥 {m.likes || 0}</button>}
        {onReply && <button className="replybtn" onClick={() => setOpen(o => !o)}>💬 Rispondi</button>}
      </div>

      {replies.length > 0 && (
        <div className="replies">
          {replies.map(r => (
            <div key={r.id} className="reply">
              <div className="bub-head">
                <span className="adot" style={{ background: r.color }} />{r.alias}
                <span className="bub-time">{fmt(r.created_at)}</span>
                {admin && <button className="del" onClick={() => onDelete(r.id)}>🗑</button>}
              </div>
              <p className="bub-text">{r.text}</p>
              {onLike && <button className={"likebtn" + (likedSet?.has(r.id) ? " on" : "")} disabled={likedSet?.has(r.id)} onClick={() => onLike(r.id)}>🔥 {r.likes || 0}</button>}
            </div>
          ))}
        </div>
      )}

      {open && onReply && (
        <div className="replybox">
          <input className="in" placeholder="Rispondi in anonimo…" value={txt}
            onChange={e => setTxt(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }} />
          <button className="btn primary xs" disabled={busy} onClick={submit}>{busy ? "…" : "Invia"}</button>
        </div>
      )}
    </div>
  );
}

// ---- Sponsor laterali (slot left/right) ----
export function AdRail({ side, sponsors = [] }) {
  const items = sponsors.filter(s => s.slot === side);
  return (
    <aside className={"adrail " + side}>
      {items.length === 0 && (
        <div className="ad"><span className="ad-tag">SPAZIO SPONSOR</span><div className="ad-body">Disponibile</div></div>
      )}
      {items.map(s => (
        <a key={s.id} className="ad filled" href={s.link || "#"} target="_blank" rel="noreferrer">
          <span className="ad-tag">SPONSOR</span>
          {s.image_url && <img src={s.image_url} alt={s.title || "sponsor"} />}
          {s.title && <div className="ad-body">{s.title}</div>}
        </a>
      ))}
    </aside>
  );
}

// ---- Sponsor nel feed (slot 'feed') ----
export function FeedSponsors({ sponsors = [] }) {
  const items = sponsors.filter(s => s.slot === "feed");
  if (!items.length) return null;
  return items.map(s => (
    <a key={s.id} className="promo" href={s.link || "#"} target="_blank" rel="noreferrer">
      <span className="ad-tag">EVENTO PROMOSSO</span>
      <div className="promo-row">
        {s.image_url ? <img className="promo-img" src={s.image_url} alt="" /> : <div className="promo-thumb">🎟️</div>}
        <div><strong>{s.title || "Evento promosso"}</strong>{s.subtitle && <><br /><small>{s.subtitle}</small></>}</div>
      </div>
    </a>
  ));
}

export function Stat({ n, l }) { return <div className="stat"><div className="stat-n">{n}</div><div className="stat-l">{l}</div></div>; }
export function Bar({ label, v, tot, c }) {
  const p = Math.round((v / Math.max(1, tot)) * 100);
  return <div className="barrow"><span className="barlab">{label}</span><div className="bartrack"><div className="barfill" style={{ width: p + "%", background: c }} /></div><span className="barv">{v}</span></div>;
}
export function RepBlock({ title, items, accent }) {
  if (!items || !items.length) return null;
  return <div className={"repblock" + (accent ? " accent" : "")}><h4>{title}</h4><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></div>;
}
