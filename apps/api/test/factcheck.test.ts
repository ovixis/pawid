import { describe, expect, it } from "vitest";
import { COUNTRIES, EU_BASE } from "@pawid/rules";
import { RULE_KEYS } from "../src/factcheck";

describe("fact check rule keys", () => {
  it("cover every EU and country rule, and nothing else", () => {
    expect(RULE_KEYS.size).toBe(EU_BASE.rules.length + COUNTRIES.reduce((n, c) => n + c.overrides.length, 0));
    expect(RULE_KEYS.has(`EU.${EU_BASE.rules[0]!.id}`)).toBe(true);
    expect(RULE_KEYS.has("FR.min_age_16_weeks")).toBe(true);
    expect(RULE_KEYS.has("FR.not_a_rule")).toBe(false);
    expect(RULE_KEYS.has("XX.min_age_16_weeks")).toBe(false);
  });
});
