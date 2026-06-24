import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";

export async function DELETE(request, { params }) {
  const { code, id } = params;
  const ownerKey = request.headers.get("x-owner-key") || new URL(request.url).searchParams.get("key");

  const { data: wall } = await db.from("walls").select("owner_key").eq("code", code).single();
  if (!wall) return NextResponse.json({ error: "Muro non trovato" }, { status: 404 });
  if (wall.owner_key !== ownerKey) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  // elimina eventuali risposte e poi il messaggio
  await db.from("messages").delete().eq("parent_id", id);
  const { error } = await db.from("messages").delete().eq("id", id).eq("wall_code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
