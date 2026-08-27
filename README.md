<div align="center">

# LumiWHYYY

**A recurring Foxy jumpscare for Lumiverse. Because apparently this was necessary.**

[![Version](https://img.shields.io/badge/version-1.1.0-e75b3d)](./spindle.json)
[![Lumiverse](https://img.shields.io/badge/Lumiverse-%E2%89%A5%201.1.0-d4a35a)](https://github.com/prolix-oc/Lumiverse)
[![Permission](https://img.shields.io/badge/permission-ui__panels-6f9f78)](./spindle.json)

</div>

LumiWHYYY does one thing: after a configurable amount of visible Lumiverse time, it fills the viewport with Foxy and plays the bundled jumpscare sound. Then it starts another full countdown.

## Features

- Any positive finite interval, with no arbitrary maximum
- Seconds, minutes, and hours controls
- Fullscreen, cover-fitted Foxy image
- Bundled 4.92-second MP3 with volume and 0.25×–4× playback-speed controls
- Countdown that pauses while the Lumiverse tab is hidden
- Click or `Escape` to dismiss immediately
- A test button that does not arm recurring scares
- User-scoped settings that survive reloads
- Responsive, theme-aware drawer UI built with Lumiverse host components
- No network calls and no external media dependencies

## Installation

1. Open **Lumiverse → Extensions**.
2. Install `https://github.com/Archkr/Lumiverse-LumiWHYYY`.
3. Enable the extension and grant its `ui_panels` permission.
4. Open **LumiWHYYY** from the drawer or command palette.
5. Choose an interval, test the scare, and arm it when ready.

Fresh installs are disarmed. Arming or testing provides the user gesture browsers require before timed audio can play. When an armed setting is restored after a reload, the countdown waits for the first click or keypress in that session, then starts from the full configured interval.

## Behavior

- Only time spent with Lumiverse visible counts toward the next scare.
- A hidden tab preserves its remaining countdown instead of catching up on return.
- The next full interval starts after the audio ends or the overlay is dismissed.
- Revoking `ui_panels` removes the overlay and pauses the scheduler while leaving the saved armed setting intact.
- Playback speed changes the current and future scare without altering the countdown interval.
- If audio playback fails, Foxy still appears for approximately the speed-adjusted MP3 duration and the drawer reports the problem.

## Permission

LumiWHYYY requests only `ui_panels`. Lumiverse gates fullscreen float widgets behind that permission. The JPG and MP3 are compiled directly into `dist/frontend.js`, so the extension does not need `media`, `images`, `cors_proxy`, or network access.

## Development

```bash
bun install
bun run typecheck
bun run test
bun run build
bun run check:dist
bun run contract
```

`dist/backend.js` and `dist/frontend.js` are committed release artifacts. The frontend build inlines `src/assets/jumpscare.jpg` and `src/assets/jumpscare.mp3` as data URLs because Lumiverse serves extension frontend code as a single JavaScript bundle.

## Project layout

```text
src/
  backend.ts          User-scoped settings and permission state
  frontend.ts         Spindle frontend entry
  runtime.ts          Browser lifecycle and host integration
  scheduler.ts        Foreground-only countdown state machine
  audio.ts            Reusable audio playback controller
  presenter.ts        Fullscreen overlay lifecycle
  ui/                 Preact drawer and themed styles
  assets/             Bundled Foxy JPG and MP3
tests/                Unit, UI, and source-contract coverage
scripts/              Deterministic production build checks
```

## License

LumiWHYYY uses the Lumiverse Community License 2.0. See [LICENSE.md](./LICENSE.md).
