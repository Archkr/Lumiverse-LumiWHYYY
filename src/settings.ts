import {
  DEFAULT_SETTINGS,
  MAX_INTERVAL_SECONDS,
  MIN_INTERVAL_SECONDS,
  SCHEMA_VERSION,
  type IntervalUnit,
  type LumiWhyyySettingsPatch,
  type LumiWhyyySettingsV1,
} from "./types";

export interface IntervalUnitSpec {
  factor: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  suffix: string;
}

export const INTERVAL_UNIT_SPECS: Record<IntervalUnit, IntervalUnitSpec> = {
  seconds: { factor: 1, min: 10, max: 86_400, step: 1, decimals: 0, suffix: " sec" },
  minutes: { factor: 60, min: 1, max: 1_440, step: 1, decimals: 0, suffix: " min" },
  hours: { factor: 3_600, min: 0.25, max: 24, step: 0.25, decimals: 2, suffix: " hr" },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clampIntervalSeconds(value: number): number {
  return Math.round(clamp(value, MIN_INTERVAL_SECONDS, MAX_INTERVAL_SECONDS));
}

export function isIntervalUnit(value: unknown): value is IntervalUnit {
  return value === "seconds" || value === "minutes" || value === "hours";
}

export function intervalValue(seconds: number, unit: IntervalUnit): number {
  const spec = INTERVAL_UNIT_SPECS[unit];
  const raw = seconds / spec.factor;
  const precision = 10 ** spec.decimals;
  return Math.round(raw * precision) / precision;
}

export function intervalSeconds(value: number, unit: IntervalUnit): number {
  return clampIntervalSeconds(value * INTERVAL_UNIT_SPECS[unit].factor);
}

export function convertIntervalUnit(
  seconds: number,
  unit: IntervalUnit,
): { intervalSeconds: number; value: number } {
  const spec = INTERVAL_UNIT_SPECS[unit];
  const converted = clamp(intervalValue(seconds, unit), spec.min, spec.max);
  return {
    value: converted,
    intervalSeconds: intervalSeconds(converted, unit),
  };
}

export function normalizeSettings(raw: unknown): LumiWhyyySettingsV1 {
  const source = asRecord(raw);
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: typeof source.revision === "number" && Number.isFinite(source.revision)
      ? Math.max(0, Math.trunc(source.revision))
      : DEFAULT_SETTINGS.revision,
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_SETTINGS.enabled,
    intervalSeconds: typeof source.intervalSeconds === "number" && Number.isFinite(source.intervalSeconds)
      ? clampIntervalSeconds(source.intervalSeconds)
      : DEFAULT_SETTINGS.intervalSeconds,
    intervalUnit: isIntervalUnit(source.intervalUnit)
      ? source.intervalUnit
      : DEFAULT_SETTINGS.intervalUnit,
    volume: typeof source.volume === "number" && Number.isFinite(source.volume)
      ? clamp(source.volume, 0, 1)
      : DEFAULT_SETTINGS.volume,
    updatedAt: typeof source.updatedAt === "number" && Number.isFinite(source.updatedAt)
      ? Math.max(0, Math.trunc(source.updatedAt))
      : DEFAULT_SETTINGS.updatedAt,
  };
}

export function parseSettingsPatch(raw: unknown): LumiWhyyySettingsPatch {
  const source = asRecord(raw);
  const patch: LumiWhyyySettingsPatch = {};

  if ("enabled" in source) {
    if (typeof source.enabled !== "boolean") throw new Error("Enabled must be true or false.");
    patch.enabled = source.enabled;
  }
  if ("intervalSeconds" in source) {
    if (typeof source.intervalSeconds !== "number" || !Number.isFinite(source.intervalSeconds)) {
      throw new Error("Interval must be a finite number of seconds.");
    }
    patch.intervalSeconds = clampIntervalSeconds(source.intervalSeconds);
  }
  if ("intervalUnit" in source) {
    if (!isIntervalUnit(source.intervalUnit)) throw new Error("Interval unit is not supported.");
    patch.intervalUnit = source.intervalUnit;
  }
  if ("volume" in source) {
    if (typeof source.volume !== "number" || !Number.isFinite(source.volume)) {
      throw new Error("Volume must be a finite number.");
    }
    patch.volume = clamp(source.volume, 0, 1);
  }

  if (Object.keys(patch).length === 0) throw new Error("No supported settings were supplied.");
  return patch;
}

export function applySettingsPatch(
  current: LumiWhyyySettingsV1,
  rawPatch: unknown,
  now = Date.now(),
): LumiWhyyySettingsV1 {
  const patch = parseSettingsPatch(rawPatch);
  const changed = Object.entries(patch).some(([key, value]) => (
    current[key as keyof LumiWhyyySettingsPatch] !== value
  ));
  if (!changed) return current;
  return normalizeSettings({
    ...current,
    ...patch,
    revision: current.revision + 1,
    updatedAt: now,
  });
}

