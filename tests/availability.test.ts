import { describe, it, expect } from "vitest";
import { computeSlots, type SlotInput } from "@/lib/availability";
import { zonedToUtc, weekdayOf, dateKey, minutesOfDay } from "@/lib/time";
import { normalizePhone } from "@/lib/phone";
import { canEditWeek, parseVagas, weekRules } from "@/lib/vagas";

const hours = [0, 1, 2, 3, 4, 5, 6].map((w) => ({ weekday: w, open: w !== 6, startMin: 540, endMin: 1140 }));
const sara = { id: "sara", workDays: [1, 2, 3, 4, 5], startMin: 540, endMin: 1080, active: true, serviceIds: ["gel"] };
const marta = { id: "marta", workDays: [0, 2, 3, 4, 5], startMin: 540, endMin: 1020, active: true, serviceIds: ["gel", "pedi"] };
const base: SlotInput = {
  day: "2026-10-09", serviceId: "gel", durationMin: 60, staffId: "any", staff: [sara, marta], hours,
  closedDays: [], busy: [], now: new Date("2026-10-01T10:00:00Z"),
};

describe("time", () => {
  it("weekday: 2026-10-05 is Monday", () => expect(weekdayOf("2026-10-05")).toBe(0));
  it("converts Lisbon summer time", () => expect(zonedToUtc("2026-10-09", 600).toISOString()).toBe("2026-10-09T09:00:00.000Z"));
  it("converts Lisbon winter time", () => expect(zonedToUtc("2026-12-09", 600).toISOString()).toBe("2026-12-09T10:00:00.000Z"));
  it("round-trips", () => { const d = zonedToUtc("2026-10-25", 870); expect(dateKey(d)).toBe("2026-10-25"); expect(minutesOfDay(d)).toBe(870); });
});

describe("computeSlots", () => {
  it("lists slots from 9:00 until service fits before closing", () => {
    const s = computeSlots(base);
    expect(s[0].startMin).toBe(540);
    expect(s.at(-1)!.startMin).toBe(1080 - 60); // Sara sai às 18:00
  });
  it("returns nothing on closed days and Sundays", () => {
    expect(computeSlots({ ...base, closedDays: ["2026-10-09"] })).toEqual([]);
    expect(computeSlots({ ...base, day: "2026-10-11" })).toEqual([]);
  });
  it("respects a technician's day off", () => {
    const mon = computeSlots({ ...base, day: "2026-10-12", staffId: "sara" });
    expect(mon).toEqual([]);
  });
  it("never offers a slot that overlaps an existing appointment", () => {
    const busy = [{ staffId: "sara", start: zonedToUtc("2026-10-09", 600), end: zonedToUtc("2026-10-09", 660) }];
    const s = computeSlots({ ...base, staffId: "sara", busy });
    const starts = s.map((x) => x.startMin);
    expect(starts).not.toContain(570); // 9:30–10:30 cruza 10:00
    expect(starts).not.toContain(600);
    expect(starts).toContain(540);
    expect(starts).toContain(660);
  });
  it("'any' falls back to another technician when one is busy", () => {
    const busy = [{ staffId: "sara", start: zonedToUtc("2026-10-09", 540), end: zonedToUtc("2026-10-09", 1140) }];
    const s = computeSlots({ ...base, busy });
    expect(s[0].staffIds).toEqual(["marta"]);
  });
  it("salon-wide blocks remove the slot for everyone", () => {
    const busy = [{ staffId: null, start: zonedToUtc("2026-10-09", 780), end: zonedToUtc("2026-10-09", 840) }];
    expect(computeSlots({ ...base, busy }).map((x) => x.startMin)).not.toContain(780);
  });
  it("hides past times today with lead time", () => {
    const now = zonedToUtc("2026-10-09", 700); // 11:40
    const s = computeSlots({ ...base, now });
    expect(s[0].startMin).toBe(780); // 13:00 (11:40 + 60 min, arredondado ao passo)
  });
  it("weekly schedule overrides the base hours (2 blocks)", () => {
    const overrides = { "2026-10-09": { open: true, startMin: 540, endMin: 660, start2Min: 1080, end2Min: 1260 } };
    const owner = { id: "matilde", workDays: [0, 1, 2, 3, 4, 5, 6], startMin: 0, endMin: 1440, active: true, serviceIds: ["gel"] };
    const starts = computeSlots({ ...base, staff: [owner], overrides }).map((x) => x.startMin);
    expect(starts).toContain(540);
    expect(starts).not.toContain(720); // fora dos blocos
    expect(starts).toContain(1080);
    expect(starts.every((m) => (m >= 540 && m + 60 <= 660) || (m >= 1080 && m + 60 <= 1260))).toBe(true);
  });
  it("a closed day in the weekly schedule has no slots even if the base is open", () => {
    const overrides = { "2026-10-09": { open: false, startMin: 540, endMin: 1140 } };
    expect(computeSlots({ ...base, overrides })).toEqual([]);
  });
  it("only offers technicians who do the service", () => {
    const s = computeSlots({ ...base, serviceId: "pedi" });
    expect(s.every((x) => x.staffIds.join() === "marta")).toBe(true);
  });
});

describe("vagas", () => {
  const owner = { id: "matilde", workDays: [0, 1, 2, 3, 4, 5, 6], startMin: 0, endMin: 1440, active: true, serviceIds: ["gel"] };
  it("only offers the exact published times", () => {
    const s = computeSlots({ ...base, staff: [owner], vagas: { "2026-10-09": [630, 870] } });
    expect(s.map((x) => x.startMin)).toEqual([630, 870]);
  });
  it("no vagas → no slots, even if hours say open", () => {
    expect(computeSlots({ ...base, staff: [owner], vagas: {} })).toEqual([]);
  });
  it("a booked vaga disappears (and a long service hides a vaga it would overlap)", () => {
    const busy = [{ staffId: "matilde", start: zonedToUtc("2026-10-09", 630), end: zonedToUtc("2026-10-09", 750) }];
    const s = computeSlots({ ...base, staff: [owner], vagas: { "2026-10-09": [630, 690, 870] }, busy });
    expect(s.map((x) => x.startMin)).toEqual([870]);
  });
  it("parses what she writes", () => {
    expect(parseVagas("10:30, 14:30")).toEqual({ ok: true, mins: [630, 870] });
    expect(parseVagas("10h10 e 17h")).toEqual({ ok: true, mins: [610, 1020] });
    expect(parseVagas("9 14.15")).toEqual({ ok: true, mins: [540, 855] });
    expect(parseVagas("")).toEqual({ ok: true, mins: [] });
    expect(parseVagas("10:30, amanhã").ok).toBe(false);
    expect(parseVagas("25:00").ok).toBe(false);
  });
  it("next week opens 2 days before (Saturday)", () => {
    // 2026-10-05 é segunda-feira
    expect(canEditWeek("2026-10-05", "2026-10-07")).toBe(true); // semana atual, a meio
    expect(canEditWeek("2026-10-12", "2026-10-09")).toBe(false); // sexta: próxima ainda fechada
    expect(canEditWeek("2026-10-12", "2026-10-10")).toBe(true); // sábado: abre
    expect(canEditWeek("2026-10-19", "2026-10-11")).toBe(false); // duas semanas à frente: nunca
    expect(canEditWeek("2026-09-28", "2026-10-07")).toBe(false); // semana passada
    expect(weekRules("2026-10-07").nextOpensOn).toBe("2026-10-10");
  });
});

describe("phone", () => {
  it("normalizes Portuguese mobiles", () => {
    expect(normalizePhone("912 345 678")).toBe("+351912345678");
    expect(normalizePhone("+351 912345678")).toBe("+351912345678");
    expect(normalizePhone("212345678")).toBeNull();
  });
});
