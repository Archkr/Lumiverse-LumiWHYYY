import { describe, expect, it } from "vitest";
import { LumiWhyyyRepository, SETTINGS_PATH, type UserStorageApi } from "../src/storage";

class MemoryStorage implements UserStorageApi {
  readonly values = new Map<string, unknown>();

  async getJson<T>(path: string, options?: { fallback?: T; userId?: string }): Promise<T> {
    const key = `${options?.userId ?? ""}:${path}`;
    return structuredClone((this.values.has(key) ? this.values.get(key) : options?.fallback) as T);
  }

  async setJson(path: string, value: unknown, options?: { userId?: string }): Promise<void> {
    this.values.set(`${options?.userId ?? ""}:${path}`, structuredClone(value));
  }
}

describe("LumiWhyyyRepository", () => {
  it("keeps settings isolated by user", async () => {
    const storage = new MemoryStorage();
    const repository = new LumiWhyyyRepository(storage);
    await repository.patchSettings("alpha", { enabled: true }, 1);
    expect((await repository.getSettings("alpha")).enabled).toBe(true);
    expect((await repository.getSettings("beta")).enabled).toBe(false);
    expect(storage.values.has(`alpha:${SETTINGS_PATH}`)).toBe(true);
  });

  it("serializes rapid patches without losing fields", async () => {
    const repository = new LumiWhyyyRepository(new MemoryStorage());
    await Promise.all([
      repository.patchSettings("alpha", { intervalSeconds: 20 }, 10),
      repository.patchSettings("alpha", { volume: 0.4 }, 11),
      repository.patchSettings("alpha", { playbackRate: 1.75 }, 12),
    ]);
    const settings = await repository.getSettings("alpha");
    expect(settings.intervalSeconds).toBe(20);
    expect(settings.volume).toBe(0.4);
    expect(settings.playbackRate).toBe(1.75);
    expect(settings.revision).toBe(3);
  });
});
