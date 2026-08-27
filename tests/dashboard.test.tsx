// @vitest-environment happy-dom

import { cleanup, render, screen } from "@testing-library/preact";
import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LumiWhyyyRuntime, RuntimeSnapshot } from "../src/runtime";
import { DEFAULT_SETTINGS } from "../src/types";
import { Dashboard } from "../src/ui/dashboard";

afterEach(cleanup);

function componentHandle() {
  return {
    componentId: "test",
    element: document.createElement("div"),
    update: vi.fn(),
    destroy: vi.fn(),
    getValue: vi.fn(),
  };
}

function runtimeFor(overrides: Partial<RuntimeSnapshot> = {}): LumiWhyyyRuntime {
  const state: RuntimeSnapshot = {
    settings: DEFAULT_SETTINGS,
    permissions: { uiPanels: false },
    scheduler: {
      status: "disarmed",
      intervalMs: 900_000,
      remainingMs: 900_000,
      enabled: false,
      ready: false,
      visible: true,
    },
    connected: true,
    saving: false,
    gestureSeen: false,
    audioUnlocked: false,
    lastScareAt: null,
    notice: null,
    ...overrides,
  };
  const ctx = {
    components: {
      mountSwitch: vi.fn(componentHandle),
      mountNumberStepper: vi.fn(componentHandle),
      mountSelect: vi.fn(componentHandle),
      mountRangeSlider: vi.fn(componentHandle),
    },
  } as unknown as SpindleFrontendContext;
  return {
    ctx,
    getSnapshot: () => state,
    subscribe: () => () => undefined,
    setEnabled: vi.fn(async () => undefined),
    setIntervalValue: vi.fn(async () => undefined),
    setIntervalUnit: vi.fn(async () => undefined),
    setVolume: vi.fn(async () => undefined),
    setPlaybackRate: vi.fn(async () => undefined),
    requestPanelPermission: vi.fn(async () => true),
    testScare: vi.fn(async () => undefined),
  } as unknown as LumiWhyyyRuntime;
}

describe("Dashboard", () => {
  it("renders the disarmed and missing-permission state", () => {
    render(<Dashboard runtime={runtimeFor()} imageUrl="data:image/jpeg;base64,test" version="1.0.0" />);
    expect(screen.getByText("Recurring jumpscares are turned off.")).toBeTruthy();
    expect(screen.getByText("Overlay permission required")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Grant access" })).toBeTruthy();
  });

  it("renders an armed countdown and the audio-unlock state", () => {
    render(<Dashboard runtime={runtimeFor({
      settings: { ...DEFAULT_SETTINGS, enabled: true },
      permissions: { uiPanels: true },
      scheduler: {
        status: "waiting",
        intervalMs: 900_000,
        remainingMs: 900_000,
        enabled: true,
        ready: false,
        visible: true,
      },
    })} imageUrl="image" version="1.0.0" />);
    expect(screen.getByText("Interaction required")).toBeTruthy();
    expect(screen.getByText("Recurring playback")).toBeTruthy();
    expect(screen.queryByText("Overlay permission required")).toBeNull();
  });

  it("advertises an unbounded positive interval and current version", () => {
    const runtime = runtimeFor();
    render(<Dashboard runtime={runtime} imageUrl="image" version="1.0.0" />);
    expect(screen.getByText(/Enter any positive duration/)).toBeTruthy();
    expect(screen.getByText("v1.0.0")).toBeTruthy();
    expect(runtime.ctx.components.mountNumberStepper).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ step: 0.1 }),
    );
  });
});
