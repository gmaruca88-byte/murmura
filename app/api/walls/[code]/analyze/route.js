import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { analyze } from "../../../../../lib/gemini";

export async function POST(request, { params }) {
  const { code } = params;
  const ownerKey = request.headers.get("x-owner-key");

  const { data: wall } = await db.from("walls").select("owner_key").eq("code", code).single();
  if (!wall) return NextResponse.json({ error: "Muro non trovato" }, { status: 404 });
  if (wall.owner_key !== ownerKey) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { data: msgs } = await db.from("messages")
    .select("id,text").eq("wall_code", code).eq("status", "live")
    .order("created_at", { ascending: true });
  if (!msgs || msgs.length === 0) return NextResponse.json({ error: "Nessun messaggio" }, { status: 400 });

  try {
    const result = await analyze(msgs);
    await db.from("analysis").upsert({ wall_code: code, data: result, generated_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    return NextResponse.json({ error: "Analisi non riuscita: " + e.message }, { status: 502 });
  }
}
