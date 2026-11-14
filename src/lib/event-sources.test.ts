import { describe, expect, it, vi, afterEach } from "vitest";
import { EVENT_DISCOVERY_SOURCES } from "./event-sources";
import { researchedEvents } from "../server/culture-research";

afterEach(() => vi.unstubAllGlobals());

describe("event discovery sources", () => {
  it.each([
    ["Time Out Buenos Aires", "https://www.timeout.com/es/buenos-aires/agenda-semana"],
    ["Vuenos Airez", "https://www.vuenosairez.com"],
    ["Agenda Cultural de Buenos Aires", "https://buenosaires.gob.ar/cultura"],
  ])("includes %s in event research requests", async (name, url) => {
    expect(EVENT_DISCOVERY_SOURCES).toContainEqual({ name, url });
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ output: [{ content: [{ text: '{"events":[]}' }] }] })));
    vi.stubGlobal("fetch", request);
    await expect(researchedEvents("test-key", "test-connection", "Ciudad de Buenos Aires")).resolves.toEqual([]);
    const body = JSON.parse(request.mock.calls[0]?.[1].body ?? "{}");
    expect(body.input).toContain(url);
  });
});