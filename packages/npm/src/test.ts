import { describe, expect, test } from "@jest/globals";
import { isSafeContext } from "./safelist.js";

describe("isSafeContext", () => {
  test("safe app name is allowed", () => {
    expect(isSafeContext("Visual Studio Code", "")).toBe(true);
  });

  test("safe URL is allowed", () => {
    expect(isSafeContext("Browser", "https://github.com/kloud-taxi")).toBe(
      true,
    );
  });

  test("unknown context is not allowed", () => {
    expect(isSafeContext("YouTube", "https://www.youtube.com/")).toBe(false);
  });
});
