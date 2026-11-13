import { describe, it, expect } from "vitest";
import { installDismissedRecently, refuseAppWorker } from "./pwa-policy";

describe("PWA installation rules", () => {
  it("keeps the invitation closed for exactly 30 days", () => {
    const closed = 1000000;
    expect(installDismissedRecently(String(closed), closed + 29 * 86400000)).toBe(true);
    expect(installDismissedRecently(String(closed), closed + 30 * 86400000)).toBe(false);
  });
  it("never registers in development or an iframe", () => {
    expect(refuseAppWorker({ production: false, framed: false, hostname: "localhost", swOff: false })).toBe(true);
    expect(refuseAppWorker({ production: true, framed: true, hostname: "butacapp.lovable.app", swOff: false })).toBe(true);
  });
  it("rejects editor previews but allows the published domain", () => {
    for (const hostname of ["id-preview--ee4985fe-f925-5403-8972-ce32c2fdb9c7.lovable.app", "preview-v2--example.gpt-eng.com", "project--example-dev.lovable.app", "demo.lovableproject-dev.com", "beta.lovable.dev"])
      expect(refuseAppWorker({ production: true, framed: false, hostname, swOff: false })).toBe(true);
    expect(refuseAppWorker({ production: true, framed: false, hostname: "butacapp.lovable.app", swOff: false })).toBe(false);
  });
  it("supports the worker kill switch", () => {
    expect(refuseAppWorker({ production: true, framed: false, hostname: "butacapp.lovable.app", swOff: true })).toBe(true);
  });
});