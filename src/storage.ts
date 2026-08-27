import { applySettingsPatch, normalizeSettings } from "./settings";
import { DEFAULT_SETTINGS, type LumiWhyyySettingsV1 } from "./types";

export interface UserStorageApi {
  getJson<T>(path: string, options?: { fallback?: T; userId?: string }): Promise<T>;
  setJson(path: string, value: unknown, options?: { indent?: number; userId?: string }): Promise<void>;
}

export const SETTINGS_PATH = "settings.v1.json";

export class LumiWhyyyRepository {
  private readonly cache = new Map<string, LumiWhyyySettingsV1>();
  private readonly writes = new Map<string, Promise<unknown>>();

  constructor(private readonly storage: UserStorageApi) {}

  async getSettings(userId: string): Promise<LumiWhyyySettingsV1> {
    const cached = this.cache.get(userId);
    if (cached) return structuredClone(cached);
    const raw = await this.storage.getJson<unknown>(SETTINGS_PATH, {
      fallback: DEFAULT_SETTINGS,
      userId,
    });
    const settings = normalizeSettings(raw);
    this.cache.set(userId, settings);
    return structuredClone(settings);
  }

  patchSettings(userId: string, patch: unknown, now = Date.now()): Promise<LumiWhyyySettingsV1> {
    const previous = this.writes.get(userId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(async () => {
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
}

