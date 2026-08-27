import { describe, expect, it, vi } from "vitest";
import { JumpscareAudioController, type AudioElementLike } from "../src/audio";

class FakeAudio extends EventTarget implements AudioElementLike {
  src = "";
  preload = "";
  volume = 1;
  playbackRate = 1;
  defaultPlaybackRate = 1;
  duration = 2.164;
  muted = false;
  currentTime = 0;
  rejectNext = false;
  playCalls = 0;
  pauseCalls = 0;

  async play(): Promise<void> {
    this.playCalls += 1;
    if (this.rejectNext) {
      this.rejectNext = false;
      throw new Error("blocked");
    }
  }

  pause(): void {
    this.pauseCalls += 1;
  }
}

describe("JumpscareAudioController", () => {
  it("primes the same audio element silently from a user gesture", async () => {
    const element = new FakeAudio();
    const audio = new JumpscareAudioController("data:audio/mpeg;base64,test", () => element);
    audio.setVolume(0.75);
    expect(await audio.unlock()).toBe(true);
    expect(element.playCalls).toBe(1);
    expect(element.pauseCalls).toBe(1);
    expect(element.currentTime).toBe(0);
    expect(element.volume).toBe(0.75);
  });

  it("reports normal completion and playback rejection", async () => {
    const element = new FakeAudio();
    const audio = new JumpscareAudioController("sound", () => element);
    const ended = vi.fn();
    const failed = vi.fn();
    await audio.play(ended, failed);
    element.dispatchEvent(new Event("ended"));
    expect(ended).toHaveBeenCalledOnce();
    expect(failed).not.toHaveBeenCalled();

    element.rejectNext = true;
    await audio.play(ended, failed);
    expect(failed).toHaveBeenCalledOnce();
  });

  it("applies volume changes during active playback", async () => {
    const element = new FakeAudio();
    const audio = new JumpscareAudioController("sound", () => element);
    await audio.play(() => undefined, () => undefined);
    audio.setVolume(0.2);
    expect(element.volume).toBe(0.2);
  });

  it("applies playback speed to current and future playback", async () => {
    const element = new FakeAudio();
    const audio = new JumpscareAudioController("sound", () => element);
    audio.setPlaybackRate(1.75);
    expect(element.playbackRate).toBe(1.75);
    expect(element.defaultPlaybackRate).toBe(1.75);
    await audio.play(() => undefined, () => undefined);
    expect(element.playbackRate).toBe(1.75);
    expect(audio.getPlaybackDurationMs()).toBeCloseTo(2_164 / 1.75);
  });
});
