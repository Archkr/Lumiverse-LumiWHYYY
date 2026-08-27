import type { JSX } from "preact";

export type IconName = "clock" | "fox" | "play" | "shield" | "sound" | "warning";

const PATHS: Record<IconName, JSX.Element> = {
  clock: <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.2v5.2l3.4 2"/></>,
  fox: <><path d="m4 5.2 4.6 2.2A8 8 0 0 1 12 6.6a8 8 0 0 1 3.4.8L20 5.2l-1.3 7.1c-.5 4.2-3 6.5-6.7 7.2-3.7-.7-6.2-3-6.7-7.2L4 5.2Z"/><path d="m8.4 12.4 2.1 1.2L12 17l1.5-3.4 2.1-1.2M8.2 10h.1M15.7 10h.1"/></>,
  play: <path d="m9 6 8 6-8 6V6Z"/>,
  shield: <path d="M12 3.2 19 6v5.2c0 4.4-2.6 7.5-7 9.6-4.4-2.1-7-5.2-7-9.6V6l7-2.8Z"/>,
  sound: <><path d="M5 10h3l4-3v10l-4-3H5v-4Z"/><path d="M15 9.2a4 4 0 0 1 0 5.6M17.5 6.8a7.2 7.2 0 0 1 0 10.4"/></>,
  warning: <><path d="M12 3.5 21 19H3L12 3.5Z"/><path d="M12 9v4.5M12 16.5h.01"/></>,
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export const LUMI_WHYYY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m4 5.2 4.6 2.2A8 8 0 0 1 12 6.6a8 8 0 0 1 3.4.8L20 5.2l-1.3 7.1c-.5 4.2-3 6.5-6.7 7.2-3.7-.7-6.2-3-6.7-7.2L4 5.2Z"/><path d="m8.4 12.4 2.1 1.2L12 17l1.5-3.4 2.1-1.2M8.2 10h.1M15.7 10h.1"/></svg>`;

