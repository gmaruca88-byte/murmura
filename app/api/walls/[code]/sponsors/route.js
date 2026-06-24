import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

async function checkOwner(code, key) {
  const { data: wall } = await db.from("walls").select("owner_key").eq("code", code).single();
  if (!wall) return "notfound";
  return wall.owner_key === key ? "ok" : "unauth";
}

// GET: sponsor attivi (vista pubblica del muro)
export async function GET(request, { params }) {
  const { code } = params;
  const { data } = await db.from("sponsors")
    .select("id,slot,title,subtitle,link,image_url,active")
    .eq("wall_code", code).eq("active", true)
    .order("created_at", { ascending: true });
  return NextResponse.json({ sponsors: data || [] });
}

// POST: crea uno sponsor (organizzatore). Accetta form-data con eventuale immagine.
export async function POST(request, { params }) {
  const { code } = params;
  const form = await request.formData();
  const key = form.get("owner_key");
  const auth = await checkOwner(code, key);
  if (auth === "notfound") return NextResponse.json({ error: "Muro non trovato" }, { status: 404 });
  if (auth === "unauth") return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  let image_url = form.get("image_url") || null;
  const file = form.get("image");
  if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
    const buf = Buffer.from(await file.arrayBuffer());
    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const path = `${code}/${Date.now()}.${ext}`;
    const up = await db.storage.from("sponsors").upload(path, buf, {
      contentType: file.type || "image/jpeg", upsert: true,
    });
    if (up.error) return NextResponse.json({ error: "Upload immagine: " + up.error.message }, { status: 500 });
    image_url = db.storage.from("sponsors").getPublicUrl(path).data.publicUrl;
  }

  const row = {
    wall_code: code, slot: form.get("slot") || "feed",
    title: form.get("title") || null, subtitle: form.get("subtitle") || null,
    link: form.get("link") || null, image_url,
  };
  const { error } = await db.from("sponsors").insert(row);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE: rimuove uno sponsor (organizzatore). ?id=..&key=..
export async function DELETE(request, { params }) {
  const { code } = params;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const key = request.headers.get("x-owner-key") || url.searchParams.get("key");
  const auth = await checkOwner(code, key);
  if (auth !== "ok") return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  const { error } = await db.from("sponsors").delete().eq("id", id).eq("wall_code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
