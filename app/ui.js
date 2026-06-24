"use client";
import React from "react";

export const DOTS = ["#FF3D7F", "#8B5CFF", "#3DECC8", "#FFB23D", "#5BC0FF", "#FF7A59"];
export const fmt = (ts) => new Date(ts).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

export function Bubble({ m, onLike }) {
  return (
    <div className="bub">
      <div className="bub-head">
        <span className="adot" style={{ background: m.color }} />{m.alias}
        <span className="bub-time">{fmt(m.created_at)}</span>
      </div>
      <p className="bub-text">{m.text}</p>
      {onLike && <button className="likebtn" onClick={() => onLike(m.id)}>🔥 {m.likes || 0}</button>}
    </div>
  );
}

export function AdRail({ side }) {
  return (
    <aside className={"adrail " + side}>
      <div className="ad"><span className="ad-tag">PUBBLICITÀ</span><div className="ad-body">Il tuo brand qui<br /><small>banner 160×600</small></div></div>
      <div className="ad small"><span className="ad-tag">PUBBLICITÀ</span><div className="ad-body">Spazio sponsor</div></div>
    </aside>
  );
}

export function PromoCard() {
  return (
    <div className="promo">
      <span className="ad-tag">EVENTO PROMOSSO</span>
      <div className="promo-row">
        <div className="promo-thumb">🎟️</div>
        <div><strong>Prossima data: Venerdì — Rooftop Session</strong><br /><small>Promosso dall'organizzatore</small></div>
      </div>
    </div>
  );
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
