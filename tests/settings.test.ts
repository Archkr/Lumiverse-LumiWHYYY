import { describe, expect, it } from "vitest";
import {
  applySettingsPatch,
  convertIntervalUnit,
  intervalSeconds,
  intervalValue,
  normalizeSettings,
  parseSettingsPatch,
} from "../src/settings";
import { DEFAULT_SETTINGS } from "../src/types";

describe("LumiWHYYY settings", () => {
  it("uses safe first-install defaults", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.enabled).toBe(false);
    expect(DEFAULT_SETTINGS.intervalSeconds).toBe(900);
    expect(DEFAULT_SETTINGS.volume).toBe(1);
    expect(DEFAULT_SETTINGS.playbackRate).toBe(1);
  });

  it("preserves any positive finite interval and repairs invalid stored values", () => {
    expect(normalizeSettings({ intervalSeconds: 0.125 }).intervalSeconds).toBe(0.125);
    expect(normalizeSettings({ intervalSeconds: 31_536_000 }).intervalSeconds).toBe(31_536_000);
    expect(normalizeSettings({ intervalSeconds: 0 }).intervalSeconds).toBe(DEFAULT_SETTINGS.intervalSeconds);
    expect(normalizeSettings({ intervalSeconds: -10 }).intervalSeconds).toBe(DEFAULT_SETTINGS.intervalSeconds);
    expect(normalizeSettings({ intervalSeconds: 999_999, volume: -2 }).volume).toBe(0);
  });

  it("converts interval display units without changing valid durations", () => {
    expect(intervalValue(900, "minutes")).toBe(15);
    expect(intervalValue(900, "hours")).toBe(0.25);
    expect(intervalSeconds(15, "minutes")).toBe(900);
    expect(intervalSeconds(0.001, "seconds")).toBe(0.001);
    expect(convertIntervalUnit(900, "hours")).toEqual({ intervalSeconds: 900, value: 0.25 });
    expect(convertIntervalUnit(90_000_000, "hours").intervalSeconds).toBe(90_000_000);
  });

  it("validates patches and increments revisions only for changes", () => {
    expect(() => parseSettingsPatch({ volume: "loud" })).toThrow(/Volume/);
    expect(() => parseSettingsPatch({ intervalSeconds: 0 })).toThrow(/greater than zero/);
    expect(parseSettingsPatch({ intervalSeconds: 10_000_000 })).toEqual({ intervalSeconds: 10_000_000 });
    expect(parseSettingsPatch({ playbackRate: 9 })).toEqual({ playbackRate: 4 });
    expect(() => parseSettingsPatch({ mystery: true })).toThrow(/No supported/);
    const next = applySettingsPatch(DEFAULT_SETTINGS, { enabled: true }, 1234);
    expect(next).toMatchObject({ enabled: true, revision: 1, updatedAt: 1234 });
    expect(applySettingsPatch(next, { enabled: true }, 2000)).toBe(next);
  });
});
