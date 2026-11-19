import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";

const base = { API_TOKEN: "x".repeat(24) };

describe("loadConfig", () => {
  test("defaults the port to 3000, also when PORT is empty", () => {
    expect(loadConfig(base).port).toBe(3000);
    expect(loadConfig({ ...base, PORT: "" }).port).toBe(3000);
  });
  test("rejects a PORT that is not a valid TCP port", () => {
    for (const PORT of ["abc", "0", "-1", "70000", "80.5"]) {
      expect(() => loadConfig({ ...base, PORT })).toThrow("PORT");
    }
  });
  test("requires a long API_TOKEN", () => {
    expect(() => loadConfig({ API_TOKEN: "short" })).toThrow("API_TOKEN");
  });
});
