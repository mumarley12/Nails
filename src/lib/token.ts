import { createHash, randomBytes } from "node:crypto";
/** Código aleatório de 128 bits para o link privado da cliente; na base fica só o hash. */
export function newToken(): { token: string; hash: string } {
  const token = randomBytes(16).toString("base64url");
  return { token, hash: hashToken(token) };
}
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
