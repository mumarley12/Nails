import { describe, it, expect } from "vitest";
import { computeSlots, type SlotInput } from "@/lib/availability";
import { zonedToUtc, weekdayOf, dateKey, minutesOfDay } from "@/lib/time";
import { normalizePhone } from "@/lib/phone";

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
  it("only offers technicians who do the service", () => {
    const s = computeSlots({ ...base, serviceId: "pedi" });
    expect(s.every((x) => x.staffIds.join() === "marta")).toBe(true);
  });
});

describe("phone", () => {
  it("normalizes Portuguese mobiles", () => {
    expect(normalizePhone("912 345 678")).toBe("+351912345678");
    expect(normalizePhone("+351 912345678")).toBe("+351912345678");
    expect(normalizePhone("212345678")).toBeNull();
  });
});
