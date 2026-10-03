/** Sessão do painel: cookie assinado (JWT HS256). Funciona no middleware (edge) e no servidor. */
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "pg_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

function key() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET em falta ou demasiado curto (mínimo 32 caracteres).");
  return new TextEncoder().encode(s);
}

export async function signSession(adminId: string): Promise<string> {
  return new SignJWT({ sub: adminId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
}

export async function verifySession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: MAX_AGE,
};
