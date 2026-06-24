import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { genCode, genKey } from "../../../lib/util";

export async function POST(request) {
  const { name, kind } = await request.json();
  if (!name || !name.trim()) return NextResponse.json({ error: "Nome mancante" }, { status: 400 });

  const code = genCode();
  const owner_key = genKey();
  const { error } = await db.from("walls").insert({ code, name: name.trim(), kind: kind || "Altro", owner_key });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  return NextResponse.json({ code, owner_key, link: `${base}/w/${code}` });
}
