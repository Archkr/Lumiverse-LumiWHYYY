export const LUMI_WHYYY_CSS = String.raw`
:where(.lw-drawer, .lw-jumpscare) {
  --lw-accent: var(--lumiverse-accent, #e75b3d);
  --lw-accent-strong: color-mix(in srgb, var(--lw-accent) 78%, #ff3b22);
  --lw-text: var(--lumiverse-text, #f5f2ef);
  --lw-muted: var(--lumiverse-text-dim, rgba(245, 242, 239, 0.7));
  --lw-bg: var(--lumiverse-bg, #121417);
  --lw-panel: color-mix(in srgb, var(--lumiverse-fill-subtle, #24272d) 84%, transparent);
  --lw-panel-strong: color-mix(in srgb, var(--lumiverse-fill-subtle, #24272d) 94%, var(--lw-bg));
  --lw-line: color-mix(in srgb, var(--lumiverse-border, #4b4e55) 72%, transparent);
  --lw-radius: var(--lumiverse-radius, 12px);
  color: var(--lw-text);
  font-family: inherit;
}

:where(.lw-drawer, .lw-jumpscare),
:where(.lw-drawer, .lw-jumpscare) *,
:where(.lw-drawer, .lw-jumpscare) *::before,
:where(.lw-drawer, .lw-jumpscare) *::after { box-sizing: border-box; }

.lw-drawer {
  min-height: 100%;
  background:
    radial-gradient(circle at 92% 1%, color-mix(in srgb, var(--lw-accent) 12%, transparent), transparent 31%),
    var(--lw-bg);
}

.lw-hero {
  position: relative;
  min-height: 236px;
  overflow: hidden;
  isolation: isolate;
  border-bottom: 1px solid var(--lw-line);
  background: #1c2e3d;
}

.lw-hero > img {
  position: absolute;
  inset: 0;
  z-index: -3;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 53% 43%;
  filter: saturate(0.96) contrast(1.04) brightness(0.76);
  transform: scale(1.025);
}

.lw-hero-shade {
  position: absolute;
  inset: 0;
  z-index: -2;
  background:
    linear-gradient(180deg, rgba(8, 12, 17, 0.02) 28%, rgba(8, 12, 17, 0.94)),
    linear-gradient(90deg, rgba(8, 12, 17, 0.68), transparent 82%);
}

.lw-hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--lw-accent), #ffbf69, transparent);
  opacity: 0.72;
}

.lw-hero-copy {
  position: absolute;
  inset: auto 20px 22px;
  max-width: 330px;
  text-shadow: 0 2px 18px rgba(0, 0, 0, 0.72);
}

.lw-eyebrow {
  display: block;
  margin-bottom: 7px;
  color: #ffd3c8;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.lw-hero h1 {
  margin: 0;
  color: #fff;
  font-size: clamp(32px, 8.5vw, 41px);
  font-weight: 900;
  letter-spacing: -0.055em;
  line-height: 0.95;
}

.lw-hero h1 span { color: #ff7659; }
.lw-hero p { max-width: 330px; margin: 10px 0 0; color: rgba(255,255,255,.82); font-size: 12px; line-height: 1.5; }
.lw-version { position: absolute; top: 15px; right: 15px; padding: 5px 8px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(7,10,14,.56); color: rgba(255,255,255,.82); font-size: 9px; font-weight: 750; backdrop-filter: blur(12px); }

.lw-content { display: flex; flex-direction: column; gap: 14px; padding: 16px; }

.lw-status-card {
  --lw-status: var(--lw-muted);
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--lw-status) 32%, var(--lw-line));
  border-radius: calc(var(--lw-radius) + 3px);
  background: linear-gradient(135deg, color-mix(in srgb, var(--lw-status) 8%, var(--lw-panel-strong)), var(--lw-panel));
  box-shadow: 0 14px 34px rgba(0,0,0,.16);
}

.lw-status-card[data-tone="accent"] { --lw-status: var(--lw-accent); }
.lw-status-card[data-tone="warning"] { --lw-status: #e6aa52; }
.lw-status-card[data-tone="danger"] { --lw-status: #ff4e39; }

.lw-countdown {
  position: relative;
  display: grid;
  width: 92px;
  height: 92px;
  place-items: center;
  border-radius: 50%;
  box-shadow: 0 0 24px color-mix(in srgb, var(--lw-status) 12%, transparent);
}

.lw-countdown svg { position: absolute; inset: 0; width: 100%; height: 100%; rotate: -90deg; overflow: visible; }
.lw-countdown circle { fill: none; stroke-width: 7; }
.lw-ring-track { stroke: color-mix(in srgb, var(--lw-line) 62%, transparent); }
.lw-ring-value { stroke: var(--lw-status); stroke-linecap: round; transition: stroke-dashoffset 350ms linear; filter: drop-shadow(0 0 4px color-mix(in srgb, var(--lw-status) 48%, transparent)); }
.lw-countdown::before { content: ""; position: absolute; inset: 10px; border-radius: 50%; background: color-mix(in srgb, var(--lw-panel-strong) 94%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--lw-line) 68%, transparent); }
.lw-countdown > div { z-index: 1; display: flex; flex-direction: column; align-items: center; }
.lw-countdown span { font-size: 18px; font-variant-numeric: tabular-nums; font-weight: 850; letter-spacing: -.045em; }
.lw-countdown small { margin-top: 3px; color: var(--lw-muted); font-size: 8px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.lw-status-copy { min-width: 0; }
.lw-status-label { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; color: var(--lw-status); font-size: 10px; font-weight: 850; letter-spacing: .13em; text-transform: uppercase; }
.lw-status-label i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; box-shadow: 0 0 10px currentColor; }
.lw-status-copy strong { display: block; font-size: 14px; line-height: 1.42; }
.lw-status-copy > small { display: block; margin-top: 8px; color: var(--lw-muted); font-size: 10px; line-height: 1.4; }

.lw-panel, .lw-permission-card {
  border: 1px solid var(--lw-line);
  border-radius: var(--lw-radius);
  background: var(--lw-panel);
}

.lw-panel { padding: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.07); }
.lw-panel-title { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 15px; }
.lw-title-icon, .lw-permission-icon { flex: 0 0 auto; display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid color-mix(in srgb, var(--lw-accent) 34%, var(--lw-line)); border-radius: 10px; color: var(--lw-accent); background: color-mix(in srgb, var(--lw-accent) 10%, transparent); }
.lw-panel-title h2 { margin: 1px 0 4px; font-size: 14px; font-weight: 800; letter-spacing: -.01em; }
.lw-panel-title p { margin: 0; color: var(--lw-muted); font-size: 10.5px; line-height: 1.5; }

.lw-arm-row, .lw-test-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 13px; border: 1px solid color-mix(in srgb, var(--lw-line) 78%, transparent); border-radius: 11px; background: color-mix(in srgb, var(--lw-panel-strong) 70%, transparent); }
.lw-arm-row > div:first-child, .lw-test-row > div:first-child { min-width: 0; }
.lw-arm-row strong, .lw-test-row strong { display: block; font-size: 11.5px; }
.lw-arm-row span, .lw-test-row span { display: block; margin-top: 4px; color: var(--lw-muted); font-size: 9.5px; line-height: 1.45; }

.lw-field-label { display: block; margin-bottom: 8px; color: var(--lw-muted); font-size: 9px; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
.lw-interval-grid { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr); gap: 9px; align-items: center; }
.lw-field-help { margin: 9px 1px 0; color: var(--lw-muted); font-size: 9.5px; line-height: 1.5; }
.lw-host-control { min-width: 0; }
.lw-switch { flex: 0 0 auto; }
.lw-impact-controls { display: grid; gap: 15px; margin: 2px 0 16px; }
.lw-impact-controls > * + * { padding-top: 15px; border-top: 1px solid color-mix(in srgb, var(--lw-line) 70%, transparent); }

.lw-permission-card { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 11px; padding: 14px; border-color: color-mix(in srgb, #e6aa52 34%, var(--lw-line)); background: color-mix(in srgb, #e6aa52 7%, var(--lw-panel)); }
.lw-permission-card .lw-permission-icon { color: #e6aa52; border-color: color-mix(in srgb, #e6aa52 35%, var(--lw-line)); background: color-mix(in srgb, #e6aa52 10%, transparent); }
.lw-permission-card strong { display: block; margin-top: 1px; font-size: 12px; }
.lw-permission-card p { margin: 5px 0 0; color: var(--lw-muted); font-size: 10px; line-height: 1.5; }
.lw-permission-card code { color: var(--lw-text); font-size: inherit; }
.lw-permission-card .lw-button { grid-column: 1 / -1; width: 100%; }

.lw-button { display: inline-flex; min-height: 38px; align-items: center; justify-content: center; gap: 8px; padding: 8px 13px; border: 1px solid var(--lw-line); border-radius: 10px; color: var(--lw-text); background: var(--lw-panel-strong); font: inherit; font-size: 10px; font-weight: 780; cursor: pointer; transition: transform 120ms ease, border-color 120ms ease, background 120ms ease; }
.lw-button:hover:not(:disabled) { transform: translateY(-1px); border-color: color-mix(in srgb, var(--lw-accent) 50%, var(--lw-line)); }
.lw-button:active:not(:disabled) { transform: translateY(0); }
.lw-button:focus-visible { outline: 2px solid var(--lw-accent); outline-offset: 2px; }
.lw-button:disabled { cursor: not-allowed; opacity: .48; }
.lw-button-primary { border-color: color-mix(in srgb, var(--lw-accent) 65%, transparent); color: #fff; background: linear-gradient(135deg, var(--lw-accent), var(--lw-accent-strong)); box-shadow: 0 7px 18px color-mix(in srgb, var(--lw-accent) 18%, transparent); }

.lw-notice { display: flex; align-items: flex-start; gap: 9px; padding: 11px 12px; border: 1px solid var(--lw-line); border-radius: 10px; background: var(--lw-panel); color: var(--lw-text); font-size: 10px; line-height: 1.45; }
.lw-notice svg { flex: 0 0 auto; margin-top: 1px; }
.lw-notice[data-tone="warning"] { border-color: color-mix(in srgb, #e6aa52 38%, var(--lw-line)); color: #f3c77f; }
.lw-notice[data-tone="error"] { border-color: color-mix(in srgb, #ff5c4a 42%, var(--lw-line)); color: #ff9387; }
.lw-notice[data-tone="success"] { border-color: color-mix(in srgb, #6dbe85 38%, var(--lw-line)); color: #91d5a3; }

.lw-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 2px 2px 8px; color: var(--lw-muted); font-size: 9px; }
.lw-footer span:first-child { display: inline-flex; align-items: center; gap: 5px; }
.lw-footer i { width: 5px; height: 5px; border-radius: 50%; background: #6dbe85; box-shadow: 0 0 7px #6dbe85; }

.lw-jumpscare {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: #030303;
  cursor: pointer;
}

.lw-jumpscare > img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; user-select: none; pointer-events: none; animation: lw-arrival 90ms cubic-bezier(.2,.8,.2,1) both; }
.lw-jumpscare-hint { position: absolute; left: 50%; bottom: max(18px, env(safe-area-inset-bottom)); translate: -50% 0; padding: 7px 11px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(0,0,0,.46); color: rgba(255,255,255,.68); font-size: 10px; font-weight: 650; letter-spacing: .02em; backdrop-filter: blur(8px); opacity: .72; pointer-events: none; }
.lw-jumpscare:focus-visible { outline: 4px solid rgba(255,255,255,.8); outline-offset: -4px; }

@keyframes lw-arrival {
  from { scale: 1.16; filter: brightness(1.85) contrast(1.22); }
  to { scale: 1; filter: brightness(1) contrast(1); }
}

@media (max-width: 360px) {
  .lw-hero { min-height: 202px; }
  .lw-content { padding: 11px; }
  .lw-status-card { grid-template-columns: 78px minmax(0, 1fr); padding: 11px; }
  .lw-countdown { width: 72px; height: 72px; }
  .lw-countdown::before { inset: 8px; }
  .lw-countdown span { font-size: 15px; }
  .lw-interval-grid { grid-template-columns: 1fr; }
  .lw-test-row { align-items: stretch; flex-direction: column; }
  .lw-test-row .lw-button { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .lw-button, .lw-jumpscare > img { animation: none; transition: none; }
}
`;
