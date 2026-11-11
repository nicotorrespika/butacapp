import { describe, expect, it, vi } from "vitest";
import type { KeyboardEvent } from "react";
import { submitBettyOnEnter } from "./betty-submit";

function key(key: string, shiftKey = false, isComposing = false) {
  const requestSubmit = vi.fn();
  const preventDefault = vi.fn();
  const event = { key, shiftKey, nativeEvent: { isComposing }, preventDefault,
    currentTarget: { form: { requestSubmit } } } as unknown as KeyboardEvent<HTMLTextAreaElement>;
  submitBettyOnEnter(event);
  return { requestSubmit, preventDefault };
}
describe("Betty keyboard submission", () => {
  it("submits once on Enter", () => { expect(key("Enter").requestSubmit).toHaveBeenCalledTimes(1); });
  it("keeps Shift+Enter for a newline", () => { expect(key("Enter", true).preventDefault).not.toHaveBeenCalled(); });
  it("does not submit while composing input", () => { expect(key("Enter", false, true).requestSubmit).not.toHaveBeenCalled(); });
});