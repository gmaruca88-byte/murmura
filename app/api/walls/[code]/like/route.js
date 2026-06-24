import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { hashIp } from "../../../../../lib/util";

// Un solo voto (fiamma) per dispositivo/IP su ogni messaggio.
export async function POST(request, { params }) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
  const ip = hashIp(request);

  // prova a registrare il like; se esiste già -> niente incremento
  const { error: insErr } = await db.from("message_likes").insert({ message_id: id, ip_hash: ip });
  if (insErr) {
    // chiave duplicata = ha già votato
    if (insErr.code === "23505") return NextResponse.json({ ok: true, already: true });
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  await db.rpc("increment_like", { msg_id: id });
  return NextResponse.json({ ok: true });
}
