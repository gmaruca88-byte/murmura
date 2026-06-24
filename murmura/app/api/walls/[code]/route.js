import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function GET(request, { params }) {
  const { code } = params;
  const { data, error } = await db.from("walls").select("code,name,kind,created_at").eq("code", code).single();
  if (error || !data) return NextResponse.json({ error: "Muro non trovato" }, { status: 404 });
  return NextResponse.json(data);
}
