"use client";
import { useEffect, useState } from "react";
import { hhmm, dateKey } from "@/lib/time";
import { SubmitButton } from "./SubmitButton";

export function RescheduleForm({ appointmentId, serviceId, addOnId, currentStaffId, staff }: { appointmentId: string; serviceId: string; addOnId: string | null; currentStaffId: string; staff: { id: string; name: string }[] }) {
  const [day, setDay] = useState(dateKey(new Date()));
  const [staffId, setStaffId] = useState(currentStaffId);
  const [slots, setSlots] = useState<number[] | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setSlots(null); setErr("");
    const p = new URLSearchParams({ day, service: serviceId, staff: staffId, exclude: appointmentId });
    if (addOnId) p.set("addon", addOnId);
    fetch(`/api/admin/slots?${p}`).then((r) => r.json()).then((d) => d.error ? setErr(d.error) : setSlots(d.slots.map((s: { startMin: number }) => s.startMin))).catch(() => setErr("Sem ligação."));
  }, [day, staffId, serviceId, addOnId, appointmentId]);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div><label className="label" htmlFor="r-day">Novo dia</label><input id="r-day" type="date" name="day" value={day} onChange={(e) => setDay(e.target.value)} className="field" required /></div>
      <input type="hidden" name="staffId" value="any" />
      <div><label className="label" htmlFor="r-time">Hora livre</label>
        <select id="r-time" name="startMin" className="field" required disabled={!slots?.length}>
          {!slots ? <option>A carregar…</option> : slots.length === 0 ? <option>Sem horas livres</option> : slots.map((m) => <option key={m} value={m}>{hhmm(m)}</option>)}
        </select></div>
      {err && <p className="text-sm text-bad-fg sm:col-span-2">{err}</p>}
      <div className="sm:col-span-2"><SubmitButton className="btn-primary h-11" disabled={!slots?.length}>Remarcar e avisar a cliente</SubmitButton></div>
    </div>
  );
}
