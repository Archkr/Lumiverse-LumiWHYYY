import { mkdir, readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, process.argv[2] ?? "dist");

const mediaTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
};

const inlineMedia = {
  name: "inline-lumi-whyyy-media",
  setup(context) {
    context.onLoad({ filter: /\.(?:jpe?g|mp3)$/i }, async ({ path }) => {
      const mime = mediaTypes[extname(path).toLowerCase()];
      if (!mime) throw new Error(`Unsupported LumiWHYYY media type: ${path}`);
      const encoded = (await readFile(path)).toString("base64");
      return {
        contents: `export default ${JSON.stringify(`data:${mime};base64,${encoded}`)};`,
        loader: "js",
      };
    });
  },
};

await mkdir(outputDirectory, { recursive: true });

const common = {
  absWorkingDir: root,
  bundle: true,
  charset: "utf8",
  format: "esm",
  legalComments: "none",
  logLevel: "info",
  sourcemap: false,
  target: "esnext",
};

await build({
  ...common,
  entryPoints: [resolve(root, "src/backend.ts")],
  outfile: resolve(outputDirectory, "backend.js"),
  platform: "node",
});

await build({
  ...common,
  entryPoints: [resolve(root, "src/frontend.ts")],
  outfile: resolve(outputDirectory, "frontend.js"),
  platform: "browser",
  plugins: [inlineMedia],
});
