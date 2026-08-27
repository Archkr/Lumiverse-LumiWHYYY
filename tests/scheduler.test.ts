import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForegroundScheduler } from "../src/scheduler";

describe("ForegroundScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => vi.useRealTimers());

  it("fires only after an enabled and ready foreground interval", () => {
    const onDue = vi.fn();
    const scheduler = new ForegroundScheduler({ intervalMs: 10_000, onDue });
    scheduler.setEnabled(true);
    vi.advanceTimersByTime(30_000);
    expect(onDue).not.toHaveBeenCalled();
    scheduler.setReady(true);
    vi.advanceTimersByTime(9_999);
    expect(onDue).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDue).toHaveBeenCalledTimes(1);
    expect(scheduler.getSnapshot().status).toBe("scaring");
  });

  it("preserves remaining visible time while hidden", () => {
    const onDue = vi.fn();
    const scheduler = new ForegroundScheduler({ intervalMs: 10_000, onDue });
    scheduler.setReady(true);
    scheduler.setEnabled(true);
    vi.advanceTimersByTime(4_000);
    scheduler.setVisible(false);
    expect(scheduler.getSnapshot().remainingMs).toBe(6_000);
    vi.advanceTimersByTime(60_000);
    expect(onDue).not.toHaveBeenCalled();
    scheduler.setVisible(true);
    vi.advanceTimersByTime(6_000);
    expect(onDue).toHaveBeenCalledTimes(1);
  });

  it("begins a full new interval after completion or interval edits", () => {
    const scheduler = new ForegroundScheduler({ intervalMs: 10_000, onDue: () => undefined });
    scheduler.setReady(true);
    scheduler.setEnabled(true);
    scheduler.triggerNow();
    scheduler.completeScare();
    expect(scheduler.getSnapshot().remainingMs).toBe(10_000);
    scheduler.setIntervalMs(25_000);
    expect(scheduler.getSnapshot().remainingMs).toBe(25_000);
  });

  it("allows a manual test while disarmed without arming recurrence", () => {
    const onDue = vi.fn();
    const scheduler = new ForegroundScheduler({ intervalMs: 10_000, onDue });
    expect(scheduler.triggerNow()).toBe(true);
    scheduler.completeScare();
    expect(scheduler.getSnapshot()).toMatchObject({ status: "disarmed", enabled: false, remainingMs: 10_000 });
  });
});

