// @vitest-environment happy-dom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JumpscarePresenter, type PresenterAudio, type PresenterWidget } from "../src/presenter";

class FakeWidget implements PresenterWidget {
  root = document.createElement("div");
  visible = false;
  destroyed = false;
  setVisible(value: boolean): void { this.visible = value; }
  destroy(): void { this.destroyed = true; }
}

class FakePresenterAudio implements PresenterAudio {
  ended: (() => void) | null = null;
  failed: ((error: Error) => void) | null = null;
  stop = vi.fn();
  play = vi.fn(async (ended: () => void, failed: (error: Error) => void) => {
    this.ended = ended;
    this.failed = failed;
  });
}

describe("JumpscarePresenter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows until audio ends", async () => {
    const widget = new FakeWidget();
    const audio = new FakePresenterAudio();
    const presenter = new JumpscarePresenter(widget, audio, "data:image/jpeg;base64,test", vi.fn(), 1_000);
    const result = presenter.present();
    expect(widget.visible).toBe(true);
    audio.ended?.();
    await expect(result).resolves.toBe("ended");
    expect(widget.visible).toBe(false);
  });

  it("supports click and Escape dismissal", async () => {
    const widget = new FakeWidget();
    const audio = new FakePresenterAudio();
    const presenter = new JumpscarePresenter(widget, audio, "image", vi.fn(), 1_000);
    const clicked = presenter.present();
    (widget.root.querySelector("button") as HTMLButtonElement).click();
    await expect(clicked).resolves.toBe("dismissed");
    expect(audio.stop).toHaveBeenCalledOnce();

    const escaped = presenter.present();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await expect(escaped).resolves.toBe("dismissed");
  });

  it("keeps the image visible for the fallback duration when audio fails", async () => {
    const widget = new FakeWidget();
    const audio = new FakePresenterAudio();
    const onError = vi.fn();
    const presenter = new JumpscarePresenter(widget, audio, "image", onError, 1_000);
    const result = presenter.present();
    audio.failed?.(new Error("blocked"));
    expect(widget.visible).toBe(true);
    expect(onError).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(1_000);
    await expect(result).resolves.toBe("timeout");
    expect(widget.visible).toBe(false);
  });

  it("adjusts the failed-audio fallback to playback speed", async () => {
    const widget = new FakeWidget();
    const audio = new FakePresenterAudio();
    const presenter = new JumpscarePresenter(widget, audio, "image", vi.fn(), 1_000);
    presenter.setPlaybackRate(2);
    const result = presenter.present();
    audio.failed?.(new Error("blocked"));
    vi.advanceTimersByTime(499);
    expect(widget.visible).toBe(true);
    vi.advanceTimersByTime(1);
    await expect(result).resolves.toBe("timeout");
  });

  it("resolves an active presentation during teardown", async () => {
    const widget = new FakeWidget();
    const presenter = new JumpscarePresenter(widget, new FakePresenterAudio(), "image", vi.fn(), 1_000);
    const result = presenter.present();
    presenter.destroy();
    await expect(result).resolves.toBe("destroyed");
    expect(widget.destroyed).toBe(true);
  });
});
