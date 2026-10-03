/**
 * Motor de disponibilidade — função pura (sem base de dados) para poder ser testada.
 * Regras: horário do salão ∩ horário da técnica − dias fechados − bloqueios − marcações ativas,
 * em passos de 30 min, com a duração completa do serviço (+ extra) a caber antes do fecho.
 */
import { minutesOfDay, dateKey, weekdayOf } from "./time";

export type StaffAvail = { id: string; workDays: number[]; startMin: number; endMin: number; active: boolean; serviceIds: string[] };
export type DayHours = { weekday: number; open: boolean; startMin: number; endMin: number };
export type Busy = { staffId: string | null; start: Date; end: Date };

export type SlotInput = {
  day: string; // AAAA-MM-DD em Lisboa
  serviceId: string;
  durationMin: number; // já inclui o extra
  staffId: string | "any";
  staff: StaffAvail[];
  hours: DayHours[];
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

export function computeSlots(input: SlotInput): Slot[] {
  const step = input.stepMin ?? 30;
  const lead = input.leadMin ?? 60;
  if (input.closedDays.includes(input.day)) return [];
  const wd = weekdayOf(input.day);
  const h = input.hours.find((x) => x.weekday === wd);
  if (!h || !h.open) return [];

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
  for (let m = h.startMin; m + input.durationMin <= h.endMin; m += step) {
    if (m < earliest) continue;
    const end = m + input.durationMin;
    if (overlaps(busyBy.get(null), m, end)) continue;
    const free = candidates.filter((s) => m >= s.startMin && end <= s.endMin && !overlaps(busyBy.get(s.id), m, end)).map((s) => s.id);
    if (free.length) out.push({ startMin: m, staffIds: free });
  }
  return out;
}
