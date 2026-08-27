export type SchedulerStatus = "disarmed" | "waiting" | "paused" | "counting" | "scaring";

export interface SchedulerSnapshot {
  status: SchedulerStatus;
  intervalMs: number;
  remainingMs: number;
  enabled: boolean;
  ready: boolean;
  visible: boolean;
}

export interface ForegroundSchedulerOptions {
  intervalMs: number;
  onDue: () => void;
  now?: () => number;
  setTimer?: (handler: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}

export class ForegroundScheduler {
  private intervalMs: number;
  private remainingMs: number;
  private deadline: number | null = null;
  private enabled = false;
  private ready = false;
  private visible = true;
  private scaring = false;
  private destroyed = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly listeners = new Set<(snapshot: SchedulerSnapshot) => void>();
  private readonly now: () => number;
  private readonly setTimer: NonNullable<ForegroundSchedulerOptions["setTimer"]>;
  private readonly clearTimer: NonNullable<ForegroundSchedulerOptions["clearTimer"]>;

  constructor(private readonly options: ForegroundSchedulerOptions) {
    this.intervalMs = Math.max(1, options.intervalMs);
    this.remainingMs = this.intervalMs;
    this.now = options.now ?? (() => Date.now());
    this.setTimer = options.setTimer ?? ((handler, delay) => setTimeout(handler, delay));
    this.clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer));
  }

  subscribe(listener: (snapshot: SchedulerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SchedulerSnapshot {
    return {
      status: this.status(),
      intervalMs: this.intervalMs,
      remainingMs: this.currentRemaining(),
      enabled: this.enabled,
      ready: this.ready,
      visible: this.visible,
    };
  }

  setEnabled(enabled: boolean): void {
    if (this.destroyed || this.enabled === enabled) return;
    this.captureRemaining();
    this.enabled = enabled;
    if (!enabled) {
      this.scaring = false;
      this.remainingMs = this.intervalMs;
    } else {
      this.remainingMs = this.intervalMs;
    }
    this.reconcile();
  }

  setReady(ready: boolean): void {
    if (this.destroyed || this.ready === ready) return;
    this.captureRemaining();
    this.ready = ready;
    this.reconcile();
  }

  setVisible(visible: boolean): void {
    if (this.destroyed || this.visible === visible) return;
    this.captureRemaining();
    this.visible = visible;
    this.reconcile();
  }

  setIntervalMs(intervalMs: number): void {
    const next = Math.max(1, intervalMs);
    if (this.destroyed || this.intervalMs === next) return;
    this.cancelTimer();
    this.intervalMs = next;
    this.remainingMs = next;
    this.deadline = null;
    this.reconcile();
  }

  triggerNow(): boolean {
    if (this.destroyed || this.scaring) return false;
    this.cancelTimer();
    this.deadline = null;
    this.remainingMs = 0;
    this.scaring = true;
    this.emit();
    this.options.onDue();
    return true;
  }

  completeScare(): void {
    if (this.destroyed || !this.scaring) return;
    this.scaring = false;
    this.remainingMs = this.intervalMs;
    this.deadline = null;
    this.reconcile();
  }

  reset(): void {
    if (this.destroyed) return;
    this.cancelTimer();
    this.deadline = null;
    this.remainingMs = this.intervalMs;
    this.reconcile();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.cancelTimer();
    this.listeners.clear();
  }

  private status(): SchedulerStatus {
    if (!this.enabled) return "disarmed";
    if (this.scaring) return "scaring";
    if (!this.ready) return "waiting";
    if (!this.visible) return "paused";
    return "counting";
  }

  private shouldCount(): boolean {
    return this.enabled && this.ready && this.visible && !this.scaring && !this.destroyed;
  }

  private currentRemaining(): number {
    if (this.deadline === null) return Math.max(0, this.remainingMs);
    return Math.max(0, this.deadline - this.now());
  }

  private captureRemaining(): void {
    if (this.deadline !== null) this.remainingMs = this.currentRemaining();
    this.cancelTimer();
    this.deadline = null;
  }

  private reconcile(): void {
    this.cancelTimer();
    this.deadline = null;
    if (this.shouldCount()) {
      if (this.remainingMs <= 0) {
        this.triggerNow();
        return;
      }
      this.deadline = this.now() + this.remainingMs;
      this.scheduleTick();
    }
    this.emit();
  }

  private scheduleTick(): void {
    if (this.deadline === null || !this.shouldCount()) return;
    const remaining = this.currentRemaining();
    const delay = Math.max(1, Math.min(1_000, remaining));
    this.timer = this.setTimer(() => {
      this.timer = null;
      if (!this.shouldCount() || this.deadline === null) return;
      this.remainingMs = this.currentRemaining();
      if (this.remainingMs <= 0) {
        this.deadline = null;
        this.triggerNow();
        return;
      }
      this.emit();
      this.scheduleTick();
    }, delay);
  }

  private cancelTimer(): void {
    if (this.timer === null) return;
    this.clearTimer(this.timer);
    this.timer = null;
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}

