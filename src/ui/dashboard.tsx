import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { LumiWhyyyRuntime, RuntimeSnapshot } from "../runtime";
import { INTERVAL_UNIT_SPECS, intervalValue, isIntervalUnit } from "../settings";
import { HostNumber, HostSpeed, HostSwitch, HostUnitSelect, HostVolume } from "./host-controls";
import { Icon } from "./icons";

export interface StatusPresentation {
  label: string;
  detail: string;
  tone: "neutral" | "accent" | "warning" | "danger";
}

export function statusPresentation(state: RuntimeSnapshot): StatusPresentation {
  if (!state.connected) return {
    label: "Connecting",
    detail: "Connecting to extension services.",
    tone: "neutral",
  };
  if (!state.settings.enabled) return {
    label: "Disabled",
    detail: "Recurring jumpscares are turned off.",
    tone: "neutral",
  };
  if (!state.permissions.uiPanels) return {
    label: "Permission required",
    detail: "Grant overlay access to enable fullscreen playback.",
    tone: "warning",
  };
  if (!state.gestureSeen) return {
    label: "Interaction required",
    detail: "Interact with Lumiverse once to enable browser audio.",
    tone: "warning",
  };
  if (state.scheduler.status === "scaring") return {
    label: "Playing",
    detail: "A jumpscare is currently active.",
    tone: "danger",
  };
  if (state.scheduler.status === "paused") return {
    label: "Paused",
    detail: "The countdown is paused while Lumiverse is hidden.",
    tone: "neutral",
  };
  return {
    label: "Scheduled",
    detail: "The countdown advances while Lumiverse is visible.",
    tone: "accent",
  };
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function useRuntime(runtime: LumiWhyyyRuntime): RuntimeSnapshot {
  const [state, setState] = useState(() => runtime.getSnapshot());
  useEffect(() => runtime.subscribe(() => setState(runtime.getSnapshot())), [runtime]);
  return state;
}

function Button(props: {
  children: ComponentChildren;
  onClick(): void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  icon?: "play" | "shield";
}) {
  return (
    <button
      type="button"
      class={`lw-button lw-button-${props.variant ?? "secondary"}`}
      onClick={props.onClick}
      disabled={props.disabled}
    >
      {props.icon && <Icon name={props.icon} size={16} />}
      <span>{props.children}</span>
    </button>
  );
}

function Notice({ notice }: { notice: RuntimeSnapshot["notice"] }) {
  if (!notice) return null;
  return (
    <div class="lw-notice" data-tone={notice.tone} role="status">
      <Icon name={notice.tone === "warning" || notice.tone === "error" ? "warning" : "shield"} size={16} />
      <span>{notice.message}</span>
    </div>
  );
}

export function Dashboard({
  runtime,
  imageUrl,
  version,
}: {
  runtime: LumiWhyyyRuntime;
  imageUrl: string;
  version: string;
}) {
  const state = useRuntime(runtime);
  const status = statusPresentation(state);
  const unit = state.settings.intervalUnit;
  const spec = INTERVAL_UNIT_SPECS[unit];
  const value = intervalValue(state.settings.intervalSeconds, unit);
  const ratio = state.scheduler.intervalMs > 0
    ? Math.min(1, Math.max(0, 1 - state.scheduler.remainingMs / state.scheduler.intervalMs))
    : 0;
  const ringLength = 2 * Math.PI * 42;
  const ringOffset = ringLength * (1 - ratio);
  const run = (operation: Promise<unknown>) => void operation.catch(() => undefined);

  return (
    <main class="lw-drawer">
      <section class="lw-hero">
        <img src={imageUrl} alt="Foxy" draggable={false} />
        <div class="lw-hero-shade" />
        <div class="lw-hero-copy">
          <h1>Lumi<span>WHYYY</span></h1>
        </div>
        <span class="lw-version">v{version}</span>
      </section>

      <div class="lw-content">
        <Notice notice={state.notice} />

        <section class="lw-status-card" data-tone={status.tone}>
          <div class="lw-countdown">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle class="lw-ring-track" cx="50" cy="50" r="42" />
              <circle
                class="lw-ring-value"
                cx="50"
                cy="50"
                r="42"
                stroke-dasharray={ringLength}
                stroke-dashoffset={ringOffset}
              />
            </svg>
            <div>
              <span>{state.settings.enabled && state.gestureSeen && state.permissions.uiPanels ? formatCountdown(state.scheduler.remainingMs) : "--:--"}</span>
              <small>next playback</small>
            </div>
          </div>
          <div class="lw-status-copy">
            <span class="lw-status-label"><i />{status.label}</span>
            <strong>{status.detail}</strong>
            <small>
              {state.lastScareAt
                ? `Last playback ${new Date(state.lastScareAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`
                : "No playback this session"}
            </small>
          </div>
        </section>

        {!state.permissions.uiPanels && state.connected && (
          <section class="lw-permission-card">
            <div class="lw-permission-icon"><Icon name="shield" size={19} /></div>
            <div>
              <strong>Overlay permission required</strong>
              <p>The <code>ui_panels</code> permission is required to display the fullscreen image.</p>
            </div>
            <Button
              variant="primary"
              icon="shield"
              onClick={() => run(runtime.requestPanelPermission())}
            >
              Grant access
            </Button>
          </section>
        )}

        <section class="lw-panel lw-arm-panel">
          <div class="lw-panel-title">
            <div class="lw-title-icon"><Icon name="fox" size={18} /></div>
            <div>
              <h2>Schedule</h2>
              <p>Enable recurring playback. This setting persists across reloads.</p>
            </div>
          </div>
          <div class="lw-arm-row">
            <div>
              <strong>Recurring playback</strong>
              <span>{state.settings.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <HostSwitch
              ctx={runtime.ctx}
              checked={state.settings.enabled}
              disabled={!state.connected || state.saving}
              label="Enable recurring jumpscares"
              onChange={(enabled) => run(runtime.setEnabled(enabled))}
            />
          </div>
        </section>

        <section class="lw-panel">
          <div class="lw-panel-title">
            <div class="lw-title-icon"><Icon name="clock" size={18} /></div>
            <div>
              <h2>Interval</h2>
              <p>A new interval starts after playback or dismissal.</p>
            </div>
          </div>
          <label class="lw-field-label">Playback interval</label>
          <div class="lw-interval-grid">
            <HostNumber
              ctx={runtime.ctx}
              value={value}
              step={spec.step}
              disabled={!state.connected || state.saving}
              onChange={(next) => run(runtime.setIntervalValue(next))}
            />
            <HostUnitSelect
              ctx={runtime.ctx}
              value={unit}
              disabled={!state.connected || state.saving}
              onChange={(next) => {
                if (isIntervalUnit(next)) run(runtime.setIntervalUnit(next));
              }}
            />
          </div>
          <p class="lw-field-help">Enter any positive duration. The countdown pauses while Lumiverse is hidden.</p>
        </section>

        <section class="lw-panel">
          <div class="lw-panel-title">
            <div class="lw-title-icon"><Icon name="sound" size={18} /></div>
            <div>
              <h2>Audio</h2>
              <p>Configure the jumpscare audio output.</p>
            </div>
          </div>
          <div class="lw-impact-controls">
            <HostVolume
              ctx={runtime.ctx}
              value={Math.round(state.settings.volume * 100)}
              disabled={!state.connected || state.saving}
              onChange={(next) => run(runtime.setVolume(next))}
            />
            <HostSpeed
              ctx={runtime.ctx}
              value={state.settings.playbackRate}
              disabled={!state.connected || state.saving}
              onChange={(next) => run(runtime.setPlaybackRate(next))}
            />
          </div>
          <div class="lw-test-row">
            <div>
              <strong>Preview</strong>
              <span>Runs once without changing the recurring schedule.</span>
            </div>
            <Button
              icon="play"
              disabled={!state.connected || state.scheduler.status === "scaring"}
              onClick={() => run(runtime.testScare())}
            >
              Run preview
            </Button>
          </div>
        </section>

        <footer class="lw-footer">
          <span><i /> Bundled media</span>
          <span>{state.saving ? "Saving…" : state.connected ? "Settings synced" : "Connecting…"}</span>
        </footer>
      </div>
    </main>
  );
}
