import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function GET(request, { params }) {
  const { code } = params;
  const ownerKey = request.headers.get("x-owner-key") || new URL(request.url).searchParams.get("key");

  const { data: wall } = await db.from("walls").select("code,name,kind,owner_key,created_at").eq("code", code).single();
  if (!wall) return NextResponse.json({ error: "Muro non trovato" }, { status: 404 });
  if (wall.owner_key !== ownerKey) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { data: msgs } = await db.from("messages").select("*").eq("wall_code", code).order("created_at", { ascending: true });
  const { data: an } = await db.from("analysis").select("data,generated_at").eq("wall_code", code).single();

  delete wall.owner_key;
  return NextResponse.json({ wall, messages: msgs || [], analysis: an || null });
}
