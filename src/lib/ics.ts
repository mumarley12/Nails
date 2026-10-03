/** Ficheiro de calendário (.ics) para "Adicionar ao calendário". */
function fmt(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
export function buildIcs(o: { uid: string; start: Date; end: Date; title: string; location: string; description: string }): string {
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Luxe Nails//Marcacoes//PT", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${o.uid}@luxenails`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(o.start)}`, `DTEND:${fmt(o.end)}`,
    `SUMMARY:${esc(o.title)}`, `LOCATION:${esc(o.location)}`, `DESCRIPTION:${esc(o.description)}`,
    "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.title)} amanhã`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.title)} daqui a 2 horas`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR", "",
  ].join("\r\n");
}
