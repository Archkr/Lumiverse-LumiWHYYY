import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "lumi-whyyy-dist-"));

function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

try {
  const exitCode = await new Promise((resolveExit, reject) => {
    const child = spawn(process.execPath, ["scripts/build.mjs", temporaryDirectory], {
      cwd: root,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolveExit(code));
  });
  if (exitCode !== 0) throw new Error("The comparison build failed.");

  const drift = [];
  for (const name of ["backend.js", "frontend.js"]) {
    const [generated, committed] = await Promise.all([
      readFile(join(temporaryDirectory, name)),
      readFile(join(root, "dist", name)).catch(() => null),
    ]);
    if (!committed || !sameBytes(generated, committed)) drift.push(`dist/${name}`);
  }
  if (drift.length) throw new Error(`Generated bundle drift detected: ${drift.join(", ")}`);
  console.log("Committed LumiWHYYY bundles match a clean production build.");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
