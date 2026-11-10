import { afterEach, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MovieTrailer } from "./MovieTrailer";

afterEach(cleanup);
it("does not load YouTube until the viewer requests playback", () => {
  const { container } = render(<MovieTrailer videoKey="abcdefghijk" title="Stalker" posterUrl={null} />);
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reproducir tráiler de Stalker" }));
  expect(container.querySelector("iframe")?.getAttribute("src")).toBe("https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1&rel=0");
});