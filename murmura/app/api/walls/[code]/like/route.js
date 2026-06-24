import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function POST(request, { params }) {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });
  const { error } = await db.rpc("increment_like", { msg_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
