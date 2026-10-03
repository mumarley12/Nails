/**
 * Vagas da semana — regras e utilitários (funções puras, testadas).
 * - A Matilde publica horas exatas; cada hora é uma vaga para 1 cliente.
 * - Só se publica semana a semana (segunda a domingo).
 * - A semana atual pode ser mudada a qualquer momento.
 * - A semana seguinte só abre 2 dias antes de começar (no sábado).
 */
import { addDays, hhmm, weekdayOf } from "./time";

export const OPEN_DAYS_BEFORE = 2;

/** Segunda-feira da semana de um dia. */
export const mondayOf = (day: string) => addDays(day, -weekdayOf(day));

export function weekRules(today: string) {
  const thisWeek = mondayOf(today);
  const nextWeek = addDays(thisWeek, 7);
  const nextOpensOn = addDays(nextWeek, -OPEN_DAYS_BEFORE);
  return { thisWeek, nextWeek, nextOpensOn, nextIsOpen: today >= nextOpensOn };
}

/** Pode publicar/alterar vagas desta semana? (só a atual, ou a seguinte a partir de sábado) */
export function canEditWeek(week: string, today: string): boolean {
  const r = weekRules(today);
  return week === r.thisWeek || (week === r.nextWeek && r.nextIsOpen);
}

/** "10:30" */
export const fmtVaga = (m: number) => hhmm(m).padStart(5, "0");
/** "10h30" / "17h" para o site */
export const fmtVagaShort = (m: number) => (m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : `${m / 60}h`);

/**
 * Lê as horas escritas pela Matilde: "10:30, 14:30", "10h30 e 17h", "9h 14.15", "17".
 * Devolve as horas em minutos (ordenadas, sem repetidas) ou o texto que não percebeu.
 */
export function parseVagas(text: string): { ok: true; mins: number[] } | { ok: false; bad: string } {
  const parts = text.toLowerCase().replace(/\s+e\s+/g, ",").split(/[,;\s/]+/).map((p) => p.trim()).filter(Boolean);
  const out = new Set<number>();
  for (const p of parts) {
    const m = p.match(/^(\d{1,2})(?:[:h.](\d{2})?)?h?$/);
    if (!m) return { ok: false, bad: p };
    const h = Number(m[1]), mi = Number(m[2] ?? 0);
    if (h > 23 || mi > 59) return { ok: false, bad: p };
    out.add(h * 60 + mi);
  }
  return { ok: true, mins: [...out].sort((a, b) => a - b) };
}
