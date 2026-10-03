export function euro(cents: number, opts: { plus?: boolean } = {}): string {
  const v = cents / 100;
  const s = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");
  return `${opts.plus ? "+" : ""}${s} €`;
}
export function parseEuroToCents(input: string | number): number | null {
  const n = typeof input === "number" ? input : Number(String(input).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}
