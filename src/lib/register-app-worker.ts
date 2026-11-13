import { refuseAppWorker } from "./pwa-policy";

/** Only this module registers the offline worker. */
export async function registerAppWorker() {
  if (!("serviceWorker" in navigator)) return;
  const refused = refuseAppWorker({ production: import.meta.env.PROD, framed: window.self !== window.top, hostname: window.location.hostname, swOff: new URLSearchParams(window.location.search).get("sw") === "off" });
  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(r => [r.active, r.waiting, r.installing].some(w => w && new URL(w.scriptURL).pathname === "/sw.js")).map(r => r.unregister()));
    return;
  }
  const { registerSW } = await import("virtual:pwa-register");
  registerSW({ immediate: true });
}