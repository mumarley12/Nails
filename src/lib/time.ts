/** Utilitários de datas no fuso do salão (Europe/Lisbon), sem dependências. */
export const TZ = "Europe/Lisbon";

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function parts(d: Date) {
  const o: Record<string, number> = {};
  for (const p of partsFmt.formatToParts(d)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** "AAAA-MM-DD" do dia em Lisboa. */
export function dateKey(d: Date): string {
  const p = parts(d);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Minutos desde a meia-noite, em Lisboa. */
export function minutesOfDay(d: Date): number {
  const p = parts(d);
  return p.hour * 60 + p.minute;
}

/** 0 = segunda … 6 = domingo, para um "AAAA-MM-DD". */
export function weekdayOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  const js = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  return (js + 6) % 7;
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

/** Converte "dia em Lisboa + minutos" para o instante UTC certo (trata a mudança de hora). */
export function zonedToUtc(key: string, minutes: number): Date {
  const [y, m, d] = key.split("-").map(Number);
  const h = Math.floor(minutes / 60), mi = minutes % 60;
  let guess = Date.UTC(y, m - 1, d, h, mi);
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(guess));
    const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const diff = asUtc - Date.UTC(y, m - 1, d, h, mi);
    if (diff === 0) break;
    guess -= diff;
  }
  return new Date(guess);
}

export function isValidDateKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

export const DIAS = ["segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado", "domingo"];
export const DIAS_CURTOS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
export const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function hhmm(min: number): string {
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
}
export function parseHHMM(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const v = Number(m[1]) * 60 + Number(m[2]);
  return v >= 0 && v <= 24 * 60 ? v : null;
}

/** "sábado, 10 de outubro" */
export function longDate(key: string): string {
  const [, m, d] = key.split("-").map(Number);
  return `${DIAS[weekdayOf(key)]}, ${d} de ${MESES[m - 1]}`;
}
/** "10 out 2026" */
export function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MESES[m - 1].slice(0, 3)} ${y}`;
}
/** Hora em Lisboa de um instante: "14:30" */
export function timeOf(d: Date): string {
  return hhmm(minutesOfDay(d));
}
