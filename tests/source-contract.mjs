import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const violations = [];
const manifest = JSON.parse(await readFile(resolve(root, "spindle.json"), "utf8"));

if (manifest.identifier !== "lumi_whyyy") violations.push("manifest identifier must be lumi_whyyy");
if (manifest.minimum_lumiverse_version !== "1.1.0") violations.push("minimum Lumiverse version must be 1.1.0");
if (JSON.stringify(manifest.permissions) !== JSON.stringify(["ui_panels"])) {
  violations.push("ui_panels must be the only requested permission");
}

const [backend, frontend, frontendSource, image, audio] = await Promise.all([
  readFile(resolve(root, "dist/backend.js"), "utf8"),
  readFile(resolve(root, "dist/frontend.js"), "utf8"),
  readFile(resolve(root, "src/frontend.ts"), "utf8"),
  stat(resolve(root, "src/assets/jumpscare.jpg")),
  stat(resolve(root, "src/assets/jumpscare.mp3")),
]);

if (!frontendSource.includes('export { setup } from "./frontend-app"')) {
  violations.push("src/frontend.ts must expose the named Spindle setup entry");
}
if (!/export\s*\{[\s\S]*setup/.test(frontend)) violations.push("frontend bundle is missing a named setup export");
if (!frontend.includes("data:image/jpeg;base64,")) violations.push("frontend bundle does not inline the JPG");
if (!frontend.includes("data:audio/mpeg;base64,")) violations.push("frontend bundle does not inline the MP3");
if (image.size !== 137_561) violations.push("provided jumpscare.jpg bytes changed");
if (audio.size !== 79_758) violations.push("provided jumpscare.mp3 bytes changed");
if (/\bfetch\s*\(|corsProxy/.test(frontend)) {
  violations.push("frontend must not make network requests");
}
if (/\beval\s*\(|new Function\s*\(/.test(backend)) violations.push("backend contains dynamic code execution");

if (violations.length) {
  console.error(violations.join("\n"));
  process.exitCode = 1;
} else {
  console.log("LumiWHYYY source and bundle contract passed.");
}
