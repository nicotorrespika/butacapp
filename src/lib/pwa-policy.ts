export const INSTALL_DISMISSAL_MS = 30 * 24 * 60 * 60 * 1000;

export function installDismissedRecently(value: string | null, now: number): boolean {
  if (!value) return false;
  const dismissed = Number(value);
  return Number.isFinite(dismissed) && now - dismissed < INSTALL_DISMISSAL_MS;
}

export function refuseAppWorker({ production, framed, hostname, swOff }: { production: boolean; framed: boolean; hostname: string; swOff: boolean }): boolean {
  const host = hostname.toLowerCase();
  const previewDomain = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
  const first = host.split(".")[0] ?? "";
  return !production || framed || swOff ||
    (previewDomain && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(first) || /^project--.+-dev$/.test(first))) ||
    /(^|\.)lovableproject(?:-dev)?\.com$/.test(host) || /(^|\.)beta\.lovable\.dev$/.test(host);
}