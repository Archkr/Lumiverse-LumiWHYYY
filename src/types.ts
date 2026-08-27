export const LUMI_WHYYY_ID = "lumi_whyyy" as const;
export const SCHEMA_VERSION = 1 as const;
export const MIN_INTERVAL_SECONDS = 10;
export const MAX_INTERVAL_SECONDS = 24 * 60 * 60;
export const JUMPSCARE_DURATION_MS = 4_923;

export type IntervalUnit = "seconds" | "minutes" | "hours";

export interface LumiWhyyySettingsV1 {
  schemaVersion: typeof SCHEMA_VERSION;
  revision: number;
  enabled: boolean;
  intervalSeconds: number;
  intervalUnit: IntervalUnit;
  volume: number;
  updatedAt: number;
}

export type LumiWhyyySettingsPatch = Partial<Pick<
  LumiWhyyySettingsV1,
  "enabled" | "intervalSeconds" | "intervalUnit" | "volume"
>>;

export interface PermissionState {
  uiPanels: boolean;
}

export interface FrontendState {
  settings: LumiWhyyySettingsV1;
  permissions: PermissionState;
}

export type FrontendToBackend =
  | { type: "ready" }
  | { type: "patch-settings"; requestId: string; patch: LumiWhyyySettingsPatch };

export type BackendToFrontend =
  | { type: "state"; state: FrontendState }
  | { type: "settings-saved"; requestId: string; settings: LumiWhyyySettingsV1 }
  | { type: "error"; requestId?: string; message: string };

export const DEFAULT_SETTINGS: LumiWhyyySettingsV1 = {
  schemaVersion: SCHEMA_VERSION,
  revision: 0,
  enabled: false,
  intervalSeconds: 15 * 60,
  intervalUnit: "minutes",
  volume: 1,
  updatedAt: 0,
};

