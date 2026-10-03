/** Normaliza um telemóvel para E.164. Aceita números portugueses (9 dígitos a começar por 9) e internacionais com +. */
export function normalizePhone(raw: string): string | null {
  const s = raw.replace(/[\s().-]/g, "");
  if (/^9[1236]\d{7}$/.test(s)) return "+351" + s;
  if (/^(00|\+)3519[1236]\d{7}$/.test(s)) return "+351" + s.slice(-9);
  if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
  return null;
}
/** "+351912345678" → "912 345 678" */
export function prettyPhone(e164: string): string {
  if (e164.startsWith("+351") && e164.length === 13) {
    const n = e164.slice(4);
    return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
  }
  return e164;
}
/** Número para links wa.me (só dígitos, com indicativo). */
export function waNumber(display: string): string {
  const e = normalizePhone(display);
  return (e ?? display).replace(/\D/g, "");
}
