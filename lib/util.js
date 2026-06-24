import crypto from "crypto";

const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // niente caratteri ambigui
function rnd(n) {
  let s = "";
  const b = crypto.randomBytes(n);
  for (let i = 0; i < n; i++) s += A[b[i] % A.length];
  return s;
}
export const genCode = () => rnd(6);   // es. K7P2QX
export const genKey = () => rnd(18);   // chiave organizzatore

export function hashIp(req) {
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || "unknown";
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.IP_HASH_SALT || "salt"))
    .digest("hex")
    .slice(0, 24);
}
