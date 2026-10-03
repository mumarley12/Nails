"use client";
import { useEffect, useState } from "react";

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Ativa os avisos de novas marcações neste telemóvel/computador. */
export function PushToggle({ vapidKey }: { vapidKey: string }) {
  const [state, setState] = useState<"loading" | "unsupported" | "ios-install" | "off" | "on" | "denied">("loading");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const standalone = window.matchMedia("(display-mode: standalone)").matches;
        return setState(ios && !standalone ? "ios-install" : "unsupported");
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setMsg("");
    try {
      if (!vapidKey) return setMsg("Falta configurar as chaves de notificação (VAPID) no servidor.");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapidKey) });
      const r = await fetch("/api/admin/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!r.ok) throw new Error();
      setState("on"); setMsg("Pronto! Este aparelho vai receber um aviso a cada marcação nova.");
    } catch { setMsg("Não foi possível ativar. Tente de novo."); }
  }
  async function disable() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await fetch("/api/admin/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
    setState("off");
  }

  return (
    <div className="rounded-card bg-brand-soft p-4 text-[13px] leading-relaxed">
      {state === "loading" && <p>A verificar…</p>}
      {state === "on" && <><p><b>Ativo neste aparelho.</b></p><button type="button" onClick={disable} className="mt-2 text-xs font-bold underline">Desativar aqui</button></>}
      {state === "off" && <button type="button" onClick={enable} className="btn-primary h-11 px-5">Ativar avisos neste aparelho</button>}
      {state === "denied" && <p>As notificações estão bloqueadas neste navegador. Ative-as nas definições do navegador para este site e volte aqui.</p>}
      {state === "ios-install" && <p><b>No iPhone:</b> abra o painel no Safari › botão Partilhar › “Adicionar ao ecrã principal”. Depois abra o painel pelo ícone novo e volte a esta página para ativar.</p>}
      {state === "unsupported" && <p>Este navegador não suporta notificações. Use o Chrome (Android/computador) ou o Safari com o painel no ecrã principal (iPhone).</p>}
      {msg && <p className="mt-2">{msg}</p>}
    </div>
  );
}
