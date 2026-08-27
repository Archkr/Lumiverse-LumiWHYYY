import { JUMPSCARE_DURATION_MS } from "./types";

export interface PresenterAudio {
  play(onEnded: () => void, onError: (error: Error) => void): Promise<void>;
  stop(): void;
}

export interface PresenterWidget {
  root: HTMLElement;
  setVisible(visible: boolean): void;
  destroy(): void;
}

export type JumpscareEndReason = "ended" | "dismissed" | "timeout" | "destroyed";

export class JumpscarePresenter {
  private readonly overlay: HTMLButtonElement;
  private activeResolve: ((reason: JumpscareEndReason) => void) | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private previousFocus: HTMLElement | null = null;
  private destroyed = false;
  private readonly keyHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") this.finish("dismissed", true);
  };

  constructor(
    private readonly widget: PresenterWidget,
    private readonly audio: PresenterAudio,
    imageUrl: string,
    private readonly onAudioError: (error: Error) => void,
    private readonly durationMs = JUMPSCARE_DURATION_MS,
  ) {
    this.overlay = document.createElement("button");
    this.overlay.type = "button";
    this.overlay.className = "lw-jumpscare";
    this.overlay.setAttribute("aria-label", "Foxy jumpscare. Click or press Escape to dismiss.");
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "Foxy lunging toward the viewer";
    image.draggable = false;
    const hint = document.createElement("span");
    hint.className = "lw-jumpscare-hint";
    hint.textContent = "Click or press Esc to dismiss";
    this.overlay.append(image, hint);
    this.overlay.addEventListener("click", () => this.finish("dismissed", true));
    this.widget.root.replaceChildren(this.overlay);
    this.setWidgetVisible(false);
  }

  isActive(): boolean {
    return this.activeResolve !== null;
  }

  present(): Promise<JumpscareEndReason> {
    if (this.destroyed) return Promise.resolve("destroyed");
    if (this.activeResolve) return Promise.resolve("dismissed");

    this.previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    try {
      this.widget.setVisible(true);
    } catch {
      return Promise.resolve("destroyed");
    }
    window.addEventListener("keydown", this.keyHandler, true);
    queueMicrotask(() => this.overlay.focus({ preventScroll: true }));

    return new Promise<JumpscareEndReason>((resolve) => {
      this.activeResolve = resolve;
      this.fallbackTimer = setTimeout(
        () => this.finish("timeout", true),
        this.durationMs + 750,
      );
      void this.audio.play(
        () => this.finish("ended", false),
        (error) => {
          this.onAudioError(error);
          if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
          this.fallbackTimer = setTimeout(
            () => this.finish("timeout", false),
            this.durationMs,
          );
        },
      );
    });
  }

  dismiss(): void {
    this.finish("dismissed", true);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.finish("destroyed", true);
    this.overlay.remove();
    try {
      this.widget.destroy();
    } catch {
      // Permission revocation can invalidate the host handle before teardown.
    }
  }

  private finish(reason: JumpscareEndReason, stopAudio: boolean): void {
    const resolve = this.activeResolve;
    if (!resolve) return;
    this.activeResolve = null;
    if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
    this.fallbackTimer = null;
    window.removeEventListener("keydown", this.keyHandler, true);
    if (stopAudio) this.audio.stop();
    this.setWidgetVisible(false);
    this.previousFocus?.focus({ preventScroll: true });
    this.previousFocus = null;
    resolve(reason);
  }

  private setWidgetVisible(visible: boolean): void {
    try {
      this.widget.setVisible(visible);
    } catch {
      // A permission-gated placement can disappear before the frontend receives state.
    }
  }
}
