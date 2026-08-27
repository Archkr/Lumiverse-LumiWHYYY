export interface AudioElementLike {
  src: string;
  preload: string;
  volume: number;
  muted: boolean;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions | boolean): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: EventListenerOptions | boolean): void;
  remove?(): void;
}

export type AudioFactory = (source: string) => AudioElementLike;

export class JumpscareAudioController {
  private readonly audio: AudioElementLike;
  private volume = 1;
  private endedHandler: EventListener | null = null;
  private errorHandler: EventListener | null = null;
  private playing = false;

  constructor(source: string, factory: AudioFactory = (url) => new Audio(url)) {
    this.audio = factory(source);
    this.audio.src = source;
    this.audio.preload = "auto";
    this.audio.volume = this.volume;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.audio.volume = this.volume;
  }

  async unlock(): Promise<boolean> {
    if (this.playing) return true;
    const previousVolume = this.volume;
    try {
      this.audio.muted = false;
      this.audio.volume = 0;
      this.audio.currentTime = 0;
      await this.audio.play();
      this.audio.pause();
      this.audio.currentTime = 0;
      return true;
    } catch {
      return false;
    } finally {
      this.audio.volume = previousVolume;
    }
  }

  async play(onEnded: () => void, onError: (error: Error) => void): Promise<void> {
    this.stop();
    this.playing = true;
    this.audio.muted = false;
    this.audio.volume = this.volume;
    this.audio.currentTime = 0;
    this.endedHandler = () => {
      this.playing = false;
      this.removeListeners();
      onEnded();
    };
    this.errorHandler = () => {
      this.playing = false;
      this.removeListeners();
      onError(new Error("The jumpscare audio could not be played."));
    };
    this.audio.addEventListener("ended", this.endedHandler, { once: true });
    this.audio.addEventListener("error", this.errorHandler, { once: true });
    try {
      await this.audio.play();
    } catch (error) {
      this.playing = false;
      this.removeListeners();
      onError(error instanceof Error ? error : new Error("The jumpscare audio could not be played."));
    }
  }

  stop(): void {
    this.playing = false;
    this.removeListeners();
    this.audio.pause();
    try {
      this.audio.currentTime = 0;
    } catch {
      // Some browser media implementations reject seeking before metadata loads.
    }
  }

  destroy(): void {
    this.stop();
    this.audio.remove?.();
  }

  private removeListeners(): void {
    if (this.endedHandler) this.audio.removeEventListener("ended", this.endedHandler);
    if (this.errorHandler) this.audio.removeEventListener("error", this.errorHandler);
    this.endedHandler = null;
    this.errorHandler = null;
  }
}

