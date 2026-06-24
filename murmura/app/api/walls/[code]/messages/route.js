import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { hashIp } from "../../../../../lib/util";
import { moderate } from "../../../../../lib/gemini";

// GET: messaggi live + ultima analisi (sezioni a tema) per la vista pubblica
export async function GET(request, { params }) {
  const { code } = params;
  const { data: msgs } = await db
    .from("messages")
    .select("id,text,alias,color,likes,category,sentiment,created_at")
    .eq("wall_code", code).eq("status", "live")
    .order("created_at", { ascending: true });
  const { data: an } = await db.from("analysis").select("data").eq("wall_code", code).single();
  return NextResponse.json({ messages: msgs || [], analysis: an?.data || null });
}

// POST: nuovo messaggio anonimo -> moderazione AI -> insert
export async function POST(request, { params }) {
  const { code } = params;
  const { text, alias, color } = await request.json();
  if (!text || !text.trim()) return NextResponse.json({ error: "Messaggio vuoto" }, { status: 400 });
  if (text.length > 600) return NextResponse.json({ error: "Troppo lungo" }, { status: 400 });

  const wall = await db.from("walls").select("code").eq("code", code).single();
  if (!wall.data) return NextResponse.json({ error: "Muro non trovato" }, { status: 404 });

  const mod = await moderate(text.trim());
  const row = {
    wall_code: code, text: text.trim(), alias: alias || "Anon", color: color || "#FF3D7F",
    status: mod.decision === "block" ? "blocked" : "live",
    needs_review: mod.needs_review, category: mod.category,
    sentiment: mod.sentiment, reason: mod.reason, ip_hash: hashIp(request),
  };
  const { error } = await db.from("messages").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (mod.decision === "block")
    return NextResponse.json({ blocked: true, reason: mod.reason || "Contenuto non consentito" });
  return NextResponse.json({ ok: true });
}
