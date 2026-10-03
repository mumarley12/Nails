/**
 * Motor de disponibilidade — função pura (sem base de dados) para poder ser testada.
 * Regras: horário da semana (ou o base) ∩ horário da técnica − dias fechados − bloqueios − marcações ativas,
 * em passos de 30 min, com a duração completa do serviço (+ extra) a caber antes do fecho.
 */
import { minutesOfDay, dateKey, weekdayOf } from "./time";

export type StaffAvail = { id: string; workDays: number[]; startMin: number; endMin: number; active: boolean; serviceIds: string[] };
export type DayHours = { weekday: number; open: boolean; startMin: number; endMin: number; start2Min?: number | null; end2Min?: number | null };
/** Um dia concreto: aberto ou não, e até 2 blocos de horas. */
export type DayPlan = Omit<DayHours, "weekday">;
export type Busy = { staffId: string | null; start: Date; end: Date };

export type SlotInput = {
  day: string; // AAAA-MM-DD em Lisboa
  serviceId: string;
  durationMin: number; // já inclui o extra
  staffId: string | "any";
  staff: StaffAvail[];
  hours: DayHours[];
  /** Horário semanal: dias concretos (AAAA-MM-DD) que substituem o horário base. */
  overrides?: Record<string, DayPlan>;
  /** Vagas publicadas (horas exatas por dia). Quando existe, só estas horas contam. */
  vagas?: Record<string, number[]>;
  closedDays: string[];
  busy: Busy[]; // marcações ativas + bloqueios (staffId null = salão todo)
  now: Date;
  stepMin?: number;
  leadMin?: number; // antecedência mínima
};

export type Slot = { startMin: number; staffIds: string[] };

export function eligibleStaff(input: Pick<SlotInput, "staff" | "serviceId" | "staffId">): StaffAvail[] {
  return input.staff.filter((s) => s.active && s.serviceIds.includes(input.serviceId) && (input.staffId === "any" || s.id === input.staffId));
}

/** O plano do dia: o da semana, se a Matilde o fez; senão o horário base desse dia da semana. */
export function dayPlan(input: Pick<SlotInput, "day" | "hours" | "overrides">): DayPlan | null {
  const o = input.overrides?.[input.day];
  if (o) return o;
  const wd = weekdayOf(input.day);
  return input.hours.find((x) => x.weekday === wd) ?? null;
}

/** Blocos válidos [início, fim) de um plano, por ordem. */
export function blocksOf(p: DayPlan | null): Array<[number, number]> {
  if (!p || !p.open) return [];
  const out: Array<[number, number]> = [];
  if (p.endMin > p.startMin) out.push([p.startMin, p.endMin]);
  if (p.start2Min != null && p.end2Min != null && p.end2Min > p.start2Min) out.push([p.start2Min, p.end2Min]);
  return out.sort((a, b) => a[0] - b[0]);
}

export function computeSlots(input: SlotInput): Slot[] {
  const step = input.stepMin ?? 30;
  const lead = input.leadMin ?? 60;
  if (input.closedDays.includes(input.day)) return [];
  const wd = weekdayOf(input.day);
  const blocks = input.vagas ? [] : blocksOf(dayPlan(input));
  const fixed = input.vagas ? (input.vagas[input.day] ?? []) : null;
  if (!blocks.length && !fixed?.length) return [];

  const today = dateKey(input.now) === input.day;
  const earliest = today ? minutesOfDay(input.now) + lead : -1;
  if (dateKey(input.now) > input.day) return [];

  // Ocupação por técnica em minutos do dia.
  const busyBy = new Map<string | null, Array<[number, number]>>();
  for (const b of input.busy) {
    const bs = dateKey(b.start) === input.day ? minutesOfDay(b.start) : dateKey(b.start) < input.day ? 0 : 24 * 60;
    const be = dateKey(b.end) === input.day ? minutesOfDay(b.end) : dateKey(b.end) > input.day ? 24 * 60 : 0;
    if (be <= bs) continue;
    const arr = busyBy.get(b.staffId) ?? [];
    arr.push([bs, be]);
    busyBy.set(b.staffId, arr);
  }
  const overlaps = (list: Array<[number, number]> | undefined, s: number, e: number) => !!list?.some(([a, b]) => s < b && a < e);

  const out: Slot[] = [];
  const candidates = eligibleStaff(input).filter((s) => s.workDays.includes(wd));
  const tryStart = (m: number) => {
    if (m < earliest || out.some((o) => o.startMin === m)) return;
    const end = m + input.durationMin;
    if (overlaps(busyBy.get(null), m, end)) return;
    const free = candidates.filter((s) => !overlaps(busyBy.get(s.id), m, end)).map((s) => s.id);
    if (free.length) out.push({ startMin: m, staffIds: free });
  };
  if (fixed) { for (const m of [...fixed].sort((a, b) => a - b)) tryStart(m); return out; }
  for (const [bStart, bEnd] of blocks) {
    for (let m = bStart; m + input.durationMin <= bEnd; m += step) {
      if (m < earliest || out.some((o) => o.startMin === m)) continue;
      const end = m + input.durationMin;
      if (overlaps(busyBy.get(null), m, end)) continue;
      const free = candidates.filter((s) => m >= s.startMin && end <= s.endMin && !overlaps(busyBy.get(s.id), m, end)).map((s) => s.id);
      if (free.length) out.push({ startMin: m, staffIds: free });
    }
  }
  return out;
}
