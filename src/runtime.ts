import type { SpindleFloatWidgetHandle, SpindleFrontendContext } from "lumiverse-spindle-types";
import { JumpscareAudioController } from "./audio";
import { JumpscarePresenter } from "./presenter";
import { ForegroundScheduler, type SchedulerSnapshot } from "./scheduler";
import {
  intervalSeconds,
  isPositiveFinite,
  normalizeSettings,
} from "./settings";
import {
  DEFAULT_SETTINGS,
  type BackendToFrontend,
  type FrontendState,
  type FrontendToBackend,
  type IntervalUnit,
  type LumiWhyyySettingsPatch,
  type LumiWhyyySettingsV1,
} from "./types";

export type NoticeTone = "info" | "success" | "warning" | "error";

export interface RuntimeSnapshot {
  settings: LumiWhyyySettingsV1;
  permissions: FrontendState["permissions"];
  scheduler: SchedulerSnapshot;
  connected: boolean;
  saving: boolean;
  gestureSeen: boolean;
  audioUnlocked: boolean;
  lastScareAt: number | null;
  notice: { tone: NoticeTone; message: string } | null;
}

interface PendingRequest {
  resolve: (settings: LumiWhyyySettingsV1) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

const INITIAL_SCHEDULER: SchedulerSnapshot = {
  status: "disarmed",
  intervalMs: DEFAULT_SETTINGS.intervalSeconds * 1_000,
  remainingMs: DEFAULT_SETTINGS.intervalSeconds * 1_000,
  enabled: false,
  ready: false,
  visible: true,
};

function requestId(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `lw-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export class LumiWhyyyRuntime {
  private readonly listeners = new Set<() => void>();
  private readonly pending = new Map<string, PendingRequest>();
  private readonly audio: JumpscareAudioController;
  private readonly scheduler: ForegroundScheduler;
  private snapshot: RuntimeSnapshot = {
    settings: DEFAULT_SETTINGS,
    permissions: { uiPanels: false },
    scheduler: INITIAL_SCHEDULER,
    connected: false,
    saving: false,
    gestureSeen: false,
    audioUnlocked: false,
    lastScareAt: null,
    notice: null,
  };
  private presenter: JumpscarePresenter | null = null;
  private unsubscribeBackend: (() => void) | null = null;
  private unsubscribeScheduler: (() => void) | null = null;
  private noticeTimer: ReturnType<typeof setTimeout> | null = null;
  private unlockPromise: Promise<boolean> | null = null;
  private started = false;
  private destroyed = false;

  constructor(
    readonly ctx: SpindleFrontendContext,
    private readonly imageUrl: string,
    audioUrl: string,
  ) {
    this.audio = new JumpscareAudioController(audioUrl);
    this.scheduler = new ForegroundScheduler({
      intervalMs: DEFAULT_SETTINGS.intervalSeconds * 1_000,
      onDue: () => void this.presentScare(),
    });
  }

  getSnapshot = (): RuntimeSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): void {
    if (this.started || this.destroyed) return;
    this.started = true;
    this.unsubscribeBackend = this.ctx.onBackendMessage((payload) => {
      this.receive(payload as BackendToFrontend);
    });
    this.unsubscribeScheduler = this.scheduler.subscribe((scheduler) => {
      this.update({ scheduler });
    });
    document.addEventListener("visibilitychange", this.handleVisibility);
    document.addEventListener("pointerdown", this.handleUnlockGesture, true);
    document.addEventListener("keydown", this.handleUnlockGesture, true);
    this.scheduler.setVisible(document.visibilityState !== "hidden");
    this.send({ type: "ready" });
  }

  async setEnabled(enabled: boolean): Promise<void> {
    if (enabled) {
      void this.recordGesture();
      const granted = await this.ensurePanelPermission();
      if (!granted) return;
    }
    await this.patchSettings({ enabled });
    this.notify(enabled ? "success" : "info", enabled ? "LumiWHYYY is armed." : "LumiWHYYY is disarmed.");
  }

  async setIntervalValue(value: number): Promise<void> {
    if (!isPositiveFinite(value)) {
      this.notify("error", "The interval must be greater than zero.");
      return;
    }
    await this.patchSettings({
      intervalSeconds: intervalSeconds(value, this.snapshot.settings.intervalUnit),
    });
  }

  async setIntervalUnit(unit: IntervalUnit): Promise<void> {
    await this.patchSettings({ intervalUnit: unit });
  }

  async setVolume(percent: number): Promise<void> {
    await this.patchSettings({ volume: Math.min(1, Math.max(0, percent / 100)) });
  }

  async setPlaybackRate(playbackRate: number): Promise<void> {
    await this.patchSettings({ playbackRate });
  }

  async requestPanelPermission(): Promise<boolean> {
    return this.ensurePanelPermission();
  }

  async testScare(): Promise<void> {
    void this.recordGesture();
    if (!(await this.ensurePanelPermission())) return;
    this.ensurePresenter();
    if (!this.presenter) return;
    if (!this.scheduler.triggerNow()) {
      this.notify("info", "Foxy is already on screen.");
    }
  }

  dismissScare(): void {
    this.presenter?.dismiss();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    document.removeEventListener("visibilitychange", this.handleVisibility);
    document.removeEventListener("pointerdown", this.handleUnlockGesture, true);
    document.removeEventListener("keydown", this.handleUnlockGesture, true);
    this.unsubscribeBackend?.();
    this.unsubscribeScheduler?.();
    this.unsubscribeBackend = null;
    this.unsubscribeScheduler = null;
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("LumiWHYYY unloaded before the request completed."));
    }
    this.pending.clear();
    this.destroyPresenter();
    this.scheduler.destroy();
    this.audio.destroy();
    this.listeners.clear();
  }

  private readonly handleVisibility = () => {
    const visible = document.visibilityState !== "hidden";
    if (!visible) this.presenter?.dismiss();
    this.scheduler.setVisible(visible);
  };

  private readonly handleUnlockGesture = () => {
    void this.recordGesture();
  };

  private async recordGesture(): Promise<boolean> {
    if (!this.snapshot.gestureSeen) {
      this.update({ gestureSeen: true });
      this.syncSchedulerReadiness();
    }
    if (this.snapshot.audioUnlocked) return true;
    if (this.unlockPromise) return this.unlockPromise;
    this.unlockPromise = this.audio.unlock().then((unlocked) => {
      if (this.destroyed) return false;
      this.update({ audioUnlocked: unlocked });
      if (unlocked) {
        document.removeEventListener("pointerdown", this.handleUnlockGesture, true);
        document.removeEventListener("keydown", this.handleUnlockGesture, true);
      }
      return unlocked;
    }).finally(() => {
      this.unlockPromise = null;
    });
    return this.unlockPromise;
  }

  private async ensurePanelPermission(): Promise<boolean> {
    if (this.snapshot.permissions.uiPanels) return true;
    try {
      const granted = await this.ctx.permissions.request(["ui_panels"], {
        reason: "LumiWHYYY needs an overlay surface to display the fullscreen Foxy jumpscare.",
      });
      const uiPanels = granted.includes("ui_panels");
      this.applyPermission(uiPanels);
      if (!uiPanels) this.notify("warning", "Overlay access is required to show the jumpscare.");
      return uiPanels;
    } catch (error) {
      this.notify("warning", error instanceof Error ? error.message : "Overlay access was not granted.");
      return false;
    }
  }

  private patchSettings(patch: LumiWhyyySettingsPatch): Promise<void> {
    const id = requestId();
    const optimistic = normalizeSettings({ ...this.snapshot.settings, ...patch });
    this.applySettings(optimistic);
    this.update({ saving: true });
    return new Promise<LumiWhyyySettingsV1>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        this.update({ saving: this.pending.size > 0 });
        this.notify("error", "Saving LumiWHYYY settings timed out.");
        this.send({ type: "ready" });
        reject(new Error("Saving LumiWHYYY settings timed out."));
      }, 10_000);
      this.pending.set(id, { resolve, reject, timeout });
      this.send({ type: "patch-settings", requestId: id, patch });
    }).then(() => undefined).catch((error) => {
      this.notify("error", error instanceof Error ? error.message : "Could not save LumiWHYYY settings.");
      throw error;
    });
  }

  private receive(message: BackendToFrontend): void {
    if (this.destroyed || !message || typeof message !== "object") return;
    if (message.type === "state") {
      this.applySettings(message.state.settings);
      this.applyPermission(message.state.permissions.uiPanels);
      this.update({ connected: true });
      return;
    }
    if (message.type === "settings-saved") {
      this.applySettings(message.settings);
      const pending = this.pending.get(message.requestId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pending.delete(message.requestId);
        pending.resolve(message.settings);
      }
      this.update({ saving: this.pending.size > 0 });
      return;
    }
    if (message.type === "error") {
      if (message.requestId) {
        const pending = this.pending.get(message.requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pending.delete(message.requestId);
          pending.reject(new Error(message.message));
        }
      }
      this.update({ saving: this.pending.size > 0 });
      this.notify("error", message.message);
      this.send({ type: "ready" });
    }
  }

  private applySettings(settings: LumiWhyyySettingsV1): void {
    const normalized = normalizeSettings(settings);
    const previous = this.snapshot.settings;
    this.audio.setVolume(normalized.volume);
    this.audio.setPlaybackRate(normalized.playbackRate);
    this.update({ settings: normalized });
    if (previous.intervalSeconds !== normalized.intervalSeconds) {
      this.scheduler.setIntervalMs(normalized.intervalSeconds * 1_000);
    }
    this.scheduler.setEnabled(normalized.enabled);
    this.syncSchedulerReadiness();
  }

  private applyPermission(uiPanels: boolean): void {
    if (this.snapshot.permissions.uiPanels === uiPanels) {
      if (uiPanels) this.ensurePresenter();
      return;
    }
    this.update({ permissions: { uiPanels } });
    if (uiPanels) this.ensurePresenter();
    else this.destroyPresenter();
    this.syncSchedulerReadiness();
  }

  private syncSchedulerReadiness(): void {
    this.scheduler.setReady(this.snapshot.permissions.uiPanels && this.snapshot.gestureSeen);
  }

  private ensurePresenter(): void {
    if (this.presenter || !this.snapshot.permissions.uiPanels || this.destroyed) return;
    try {
      const widget: SpindleFloatWidgetHandle = this.ctx.ui.createFloatWidget({
        width: window.innerWidth,
        height: window.innerHeight,
        initialPosition: { x: 0, y: 0 },
        chromeless: true,
        fullscreen: true,
        tooltip: "LumiWHYYY jumpscare",
      });
      this.presenter = new JumpscarePresenter(
        widget,
        this.audio,
        this.imageUrl,
        (error) => this.notify("warning", `${error.message} Foxy still showed up.`),
      );
    } catch (error) {
      this.presenter = null;
      this.notify("error", error instanceof Error ? error.message : "Could not create the jumpscare overlay.");
    }
  }

  private destroyPresenter(): void {
    const presenter = this.presenter;
    this.presenter = null;
    if (!presenter) return;
    try {
      presenter.destroy();
    } catch {
      // The host may already have destroyed a permission-gated placement.
    }
  }

  private async presentScare(): Promise<void> {
    if (this.destroyed || !this.snapshot.permissions.uiPanels) {
      this.scheduler.completeScare();
      return;
    }
    this.ensurePresenter();
    if (!this.presenter) {
      this.scheduler.completeScare();
      return;
    }
    this.update({ lastScareAt: Date.now() });
    try {
      await this.presenter.present();
    } catch (error) {
      this.notify("error", error instanceof Error ? error.message : "The jumpscare overlay failed.");
    } finally {
      this.scheduler.completeScare();
    }
  }

  private send(message: FrontendToBackend): void {
    this.ctx.sendToBackend(message);
  }

  private notify(tone: NoticeTone, message: string): void {
    if (this.noticeTimer) clearTimeout(this.noticeTimer);
    this.update({ notice: { tone, message } });
    this.noticeTimer = setTimeout(() => {
      this.noticeTimer = null;
      this.update({ notice: null });
    }, 6_000);
  }

  private update(patch: Partial<RuntimeSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
}
