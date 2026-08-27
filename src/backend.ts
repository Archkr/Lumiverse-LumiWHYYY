import type { SpindleAPI } from "lumiverse-spindle-types";
import { LumiWhyyyRepository } from "./storage";
import type { BackendToFrontend, FrontendState, FrontendToBackend } from "./types";

declare const spindle: SpindleAPI;

const repository = new LumiWhyyyRepository(spindle.userStorage);
const activeUsers = new Set<string>();

function permissionState(): FrontendState["permissions"] {
  return { uiPanels: spindle.permissions.has("ui_panels") };
}

function send(message: BackendToFrontend, userId: string): void {
  spindle.sendToFrontend(message, userId);
}

async function sendState(userId: string): Promise<void> {
  send({
    type: "state",
    state: {
      settings: await repository.getSettings(userId),
      permissions: permissionState(),
    },
  }, userId);
}

function isFrontendMessage(value: unknown): value is FrontendToBackend {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const type = (value as { type?: unknown }).type;
  return type === "ready" || type === "patch-settings";
}

spindle.onFrontendMessage(async (payload, userId) => {
  if (!isFrontendMessage(payload)) {
    send({ type: "error", message: "LumiWHYYY received an unsupported request." }, userId);
    return;
  }

  activeUsers.add(userId);
  try {
    if (payload.type === "ready") {
      await sendState(userId);
      return;
    }

    if (typeof payload.requestId !== "string" || !payload.requestId) {
      throw new Error("The settings request is missing an ID.");
    }
    const settings = await repository.patchSettings(userId, payload.patch);
    send({ type: "settings-saved", requestId: payload.requestId, settings }, userId);
    await sendState(userId);
  } catch (error) {
    send({
      type: "error",
      requestId: "requestId" in payload ? payload.requestId : undefined,
      message: error instanceof Error ? error.message : "LumiWHYYY could not save its settings.",
    }, userId);
  }
});

spindle.permissions.onChanged(() => {
  for (const userId of activeUsers) void sendState(userId).catch(() => undefined);
});

