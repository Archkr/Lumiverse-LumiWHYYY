import { describe, expect, it } from "vitest";
import {
  applySettingsPatch,
  convertIntervalUnit,
  intervalSeconds,
  intervalValue,
  normalizeSettings,
  parseSettingsPatch,
} from "../src/settings";
import { DEFAULT_SETTINGS, MAX_INTERVAL_SECONDS, MIN_INTERVAL_SECONDS } from "../src/types";

describe("LumiWHYYY settings", () => {
  it("uses safe first-install defaults", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.enabled).toBe(false);
    expect(DEFAULT_SETTINGS.intervalSeconds).toBe(900);
    expect(DEFAULT_SETTINGS.volume).toBe(1);
  });

  it("normalizes stored values into supported bounds", () => {
    expect(normalizeSettings({ intervalSeconds: 1, volume: 9 }).intervalSeconds).toBe(MIN_INTERVAL_SECONDS);
    expect(normalizeSettings({ intervalSeconds: 999_999, volume: -2 }).intervalSeconds).toBe(MAX_INTERVAL_SECONDS);
    expect(normalizeSettings({ intervalSeconds: 999_999, volume: -2 }).volume).toBe(0);
  });

  it("converts interval display units without changing valid durations", () => {
    expect(intervalValue(900, "minutes")).toBe(15);
    expect(intervalValue(900, "hours")).toBe(0.25);
    expect(intervalSeconds(15, "minutes")).toBe(900);
    expect(convertIntervalUnit(900, "hours")).toEqual({ intervalSeconds: 900, value: 0.25 });
  });

  it("validates patches and increments revisions only for changes", () => {
    expect(() => parseSettingsPatch({ volume: "loud" })).toThrow(/Volume/);
    expect(() => parseSettingsPatch({ mystery: true })).toThrow(/No supported/);
    const next = applySettingsPatch(DEFAULT_SETTINGS, { enabled: true }, 1234);
    expect(next).toMatchObject({ enabled: true, revision: 1, updatedAt: 1234 });
    expect(applySettingsPatch(next, { enabled: true }, 2000)).toBe(next);
  });
});

