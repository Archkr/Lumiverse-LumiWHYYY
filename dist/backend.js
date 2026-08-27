// src/types.ts
var SCHEMA_VERSION = 1;
var MIN_PLAYBACK_RATE = 0.25;
var MAX_PLAYBACK_RATE = 4;
var DEFAULT_SETTINGS = {
  schemaVersion: SCHEMA_VERSION,
  revision: 0,
  enabled: false,
  intervalSeconds: 15 * 60,
  intervalUnit: "minutes",
  volume: 1,
  playbackRate: 1,
  updatedAt: 0
};

// src/settings.ts
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function isPositiveFinite(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
function isIntervalUnit(value) {
  return value === "seconds" || value === "minutes" || value === "hours";
}
function normalizeSettings(raw) {
  const source = asRecord(raw);
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: typeof source.revision === "number" && Number.isFinite(source.revision) ? Math.max(0, Math.trunc(source.revision)) : DEFAULT_SETTINGS.revision,
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_SETTINGS.enabled,
    intervalSeconds: isPositiveFinite(source.intervalSeconds) ? source.intervalSeconds : DEFAULT_SETTINGS.intervalSeconds,
    intervalUnit: isIntervalUnit(source.intervalUnit) ? source.intervalUnit : DEFAULT_SETTINGS.intervalUnit,
    volume: typeof source.volume === "number" && Number.isFinite(source.volume) ? clamp(source.volume, 0, 1) : DEFAULT_SETTINGS.volume,
    playbackRate: typeof source.playbackRate === "number" && Number.isFinite(source.playbackRate) ? clamp(source.playbackRate, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE) : DEFAULT_SETTINGS.playbackRate,
    updatedAt: typeof source.updatedAt === "number" && Number.isFinite(source.updatedAt) ? Math.max(0, Math.trunc(source.updatedAt)) : DEFAULT_SETTINGS.updatedAt
  };
}
function parseSettingsPatch(raw) {
  const source = asRecord(raw);
  const patch = {};
  if ("enabled" in source) {
    if (typeof source.enabled !== "boolean") throw new Error("Enabled must be true or false.");
    patch.enabled = source.enabled;
  }
  if ("intervalSeconds" in source) {
    if (!isPositiveFinite(source.intervalSeconds)) {
      throw new Error("Interval must be a finite number greater than zero.");
    }
    patch.intervalSeconds = source.intervalSeconds;
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
  if ("playbackRate" in source) {
    if (typeof source.playbackRate !== "number" || !Number.isFinite(source.playbackRate)) {
      throw new Error("Playback speed must be a finite number.");
    }
    patch.playbackRate = clamp(source.playbackRate, MIN_PLAYBACK_RATE, MAX_PLAYBACK_RATE);
  }
  if (Object.keys(patch).length === 0) throw new Error("No supported settings were supplied.");
  return patch;
}
function applySettingsPatch(current, rawPatch, now = Date.now()) {
  const patch = parseSettingsPatch(rawPatch);
  const changed = Object.entries(patch).some(([key, value]) => current[key] !== value);
  if (!changed) return current;
  return normalizeSettings({
    ...current,
    ...patch,
    revision: current.revision + 1,
    updatedAt: now
  });
}

// src/storage.ts
var SETTINGS_PATH = "settings.v1.json";
var LumiWhyyyRepository = class {
  constructor(storage) {
    this.storage = storage;
  }
  storage;
  cache = /* @__PURE__ */ new Map();
  writes = /* @__PURE__ */ new Map();
  async getSettings(userId) {
    const cached = this.cache.get(userId);
    if (cached) return structuredClone(cached);
    const raw = await this.storage.getJson(SETTINGS_PATH, {
      fallback: DEFAULT_SETTINGS,
      userId
    });
    const settings = normalizeSettings(raw);
    this.cache.set(userId, settings);
    return structuredClone(settings);
  }
  patchSettings(userId, patch, now = Date.now()) {
    const previous = this.writes.get(userId) ?? Promise.resolve();
    const next = previous.catch(() => void 0).then(async () => {
      const current = await this.getSettings(userId);
      const updated = applySettingsPatch(current, patch, now);
      if (updated !== current) {
        await this.storage.setJson(SETTINGS_PATH, updated, { indent: 2, userId });
        this.cache.set(userId, updated);
      }
      return structuredClone(updated);
    });
    this.writes.set(userId, next);
    const cleanup = () => {
      if (this.writes.get(userId) === next) this.writes.delete(userId);
    };
    void next.then(cleanup, cleanup);
    return next;
  }
};

// src/backend.ts
var repository = new LumiWhyyyRepository(spindle.userStorage);
var activeUsers = /* @__PURE__ */ new Set();
function permissionState() {
  return { uiPanels: spindle.permissions.has("ui_panels") };
}
function send(message, userId) {
  spindle.sendToFrontend(message, userId);
}
async function sendState(userId) {
  send({
    type: "state",
    state: {
      settings: await repository.getSettings(userId),
      permissions: permissionState()
    }
  }, userId);
}
function isFrontendMessage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const type = value.type;
  return type === "ready" || type === "patch-settings";
}
spindle.onFrontendMessage(async (payload, userId) => {
  if (!isFrontendMessage(payload)) {
    send({ type: "error", message: "LumiWHYYY received an unsupported request." }, userId);
    return;
  }
  activeUsers.add(userId);
  try {
    if (payload.type === "ready") {
      await sendState(userId);
      return;
    }
    if (typeof payload.requestId !== "string" || !payload.requestId) {
      throw new Error("The settings request is missing an ID.");
    }
    const settings = await repository.patchSettings(userId, payload.patch);
    send({ type: "settings-saved", requestId: payload.requestId, settings }, userId);
    await sendState(userId);
  } catch (error) {
    send({
      type: "error",
      requestId: "requestId" in payload ? payload.requestId : void 0,
      message: error instanceof Error ? error.message : "LumiWHYYY could not save its settings."
    }, userId);
  }
});
spindle.permissions.onChanged(() => {
  for (const userId of activeUsers) void sendState(userId).catch(() => void 0);
});
