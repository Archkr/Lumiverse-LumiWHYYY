import type { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { LumiWhyyyRuntime, RuntimeSnapshot } from "../runtime";
import { INTERVAL_UNIT_SPECS, intervalValue, isIntervalUnit } from "../settings";
import type { IntervalUnit } from "../types";
import { HostNumber, HostSwitch, HostUnitSelect, HostVolume } from "./host-controls";
import { Icon } from "./icons";

export interface StatusPresentation {
  label: string;
  detail: string;
  tone: "neutral" | "accent" | "warning" | "danger";
}

export function statusPresentation(state: RuntimeSnapshot): StatusPresentation {
  if (!state.connected) return {
    label: "Connecting",
    detail: "Waiting for the LumiWHYYY backend.",
    tone: "neutral",
  };
  if (!state.settings.enabled) return {
    label: "Disarmed",
    detail: "Foxy is safely contained. For now.",
    tone: "neutral",
  };
  if (!state.permissions.uiPanels) return {
    label: "Needs access",
    detail: "Grant overlay access before the countdown can begin.",
    tone: "warning",
  };
  if (!state.gestureSeen) return {
    label: "Awaiting interaction",
    detail: "Click or press a key once so the browser can unlock sound.",
    tone: "warning",
  };
  if (state.scheduler.status === "scaring") return {
    label: "FOXY",
    detail: "Well. There he is.",
    tone: "danger",
  };
  if (state.scheduler.status === "paused") return {
    label: "Paused",
    detail: "The countdown waits while Lumiverse is hidden.",
    tone: "neutral",
  };
  return {
    label: "Armed",
    detail: "The countdown advances only while this page is visible.",
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

function intervalHelp(unit: IntervalUnit): string {
  const spec = INTERVAL_UNIT_SPECS[unit];
  if (unit === "seconds") return `${spec.min.toLocaleString()}–${spec.max.toLocaleString()} seconds`;
  if (unit === "minutes") return `${spec.min.toLocaleString()}–${spec.max.toLocaleString()} minutes`;
  return "15 minutes–24 hours";
}

export function Dashboard({
  runtime,
  imageUrl,
}: {
  runtime: LumiWhyyyRuntime;
  imageUrl: string;
}) {
  const state = useRuntime(runtime);
  const status = statusPresentation(state);
  const unit = state.settings.intervalUnit;
  const spec = INTERVAL_UNIT_SPECS[unit];
  const value = intervalValue(state.settings.intervalSeconds, unit);
  const ratio = state.scheduler.intervalMs > 0
    ? Math.min(1, Math.max(0, 1 - state.scheduler.remainingMs / state.scheduler.intervalMs))
    : 0;
  const progress = `${Math.round(ratio * 100)}%`;
  const run = (operation: Promise<unknown>) => void operation.catch(() => undefined);

  return (
    <main class="lw-drawer">
      <section class="lw-hero">
        <img src={imageUrl} alt="Foxy" draggable={false} />
        <div class="lw-hero-shade" />
        <div class="lw-hero-copy">
          <span class="lw-eyebrow">A deeply necessary extension</span>
          <h1>Lumi<span>WHYYY</span></h1>
          <p>Recurring Foxy delivery, calibrated with alarming precision.</p>
        </div>
        <span class="lw-version">v1.0.0</span>
      </section>

      <div class="lw-content">
        <Notice notice={state.notice} />

        <section class="lw-status-card" data-tone={status.tone}>
          <div class="lw-countdown" style={{ "--lw-progress": progress }}>
            <div>
              <span>{state.settings.enabled && state.gestureSeen && state.permissions.uiPanels ? formatCountdown(state.scheduler.remainingMs) : "--:--"}</span>
              <small>next visit</small>
            </div>
          </div>
          <div class="lw-status-copy">
            <span class="lw-status-label"><i />{status.label}</span>
            <strong>{status.detail}</strong>
            <small>
              {state.lastScareAt
                ? `Last appearance ${new Date(state.lastScareAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}`
                : "No appearances this session"}
            </small>
          </div>
        </section>

        {!state.permissions.uiPanels && state.connected && (
          <section class="lw-permission-card">
            <div class="lw-permission-icon"><Icon name="shield" size={19} /></div>
            <div>
              <strong>Overlay access required</strong>
              <p>Lumiverse uses the <code>ui_panels</code> permission for the fullscreen scare surface.</p>
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
              <h2>Containment controls</h2>
              <p>Arming is remembered. Each reload begins with a fresh countdown.</p>
            </div>
          </div>
          <div class="lw-arm-row">
            <div>
              <strong>{state.settings.enabled ? "Jumpscares armed" : "Jumpscares disarmed"}</strong>
              <span>{state.settings.enabled ? "Foxy has been released into the scheduler." : "Nothing terrible is currently scheduled."}</span>
            </div>
            <HostSwitch
              ctx={runtime.ctx}
              checked={state.settings.enabled}
              disabled={!state.connected || state.saving}
              label="Arm recurring jumpscares"
              onChange={(enabled) => run(runtime.setEnabled(enabled))}
            />
          </div>
        </section>

        <section class="lw-panel">
          <div class="lw-panel-title">
            <div class="lw-title-icon"><Icon name="clock" size={18} /></div>
            <div>
              <h2>Timing</h2>
              <p>A full quiet interval begins after Foxy leaves the screen.</p>
            </div>
          </div>
          <label class="lw-field-label">Scare every</label>
          <div class="lw-interval-grid">
            <HostNumber
              ctx={runtime.ctx}
              value={value}
              min={spec.min}
              max={spec.max}
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
          <p class="lw-field-help">Allowed range: {intervalHelp(unit)}. Hidden-tab time never counts.</p>
        </section>

        <section class="lw-panel">
          <div class="lw-panel-title">
            <div class="lw-title-icon"><Icon name="sound" size={18} /></div>
            <div>
              <h2>Impact</h2>
              <p>The provided 4.92-second MP3 plays locally at this level.</p>
            </div>
          </div>
          <HostVolume
            ctx={runtime.ctx}
            value={Math.round(state.settings.volume * 100)}
            disabled={!state.connected || state.saving}
            onChange={(next) => run(runtime.setVolume(next))}
          />
          <div class="lw-test-row">
            <div>
              <strong>Quality assurance</strong>
              <span>Does not arm the recurring timer by itself.</span>
            </div>
            <Button
              icon="play"
              disabled={!state.connected || state.scheduler.status === "scaring"}
              onClick={() => run(runtime.testScare())}
            >
              Test jumpscare
            </Button>
          </div>
        </section>

        <footer class="lw-footer">
          <span><i /> Local media only</span>
          <span>{state.saving ? "Saving…" : state.connected ? "Settings synced" : "Connecting…"}</span>
        </footer>
      </div>
    </main>
  );
}
