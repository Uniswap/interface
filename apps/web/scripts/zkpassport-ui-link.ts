// oxlint-disable eslint-js/no-restricted-syntax -- Node-side script
/**
 * Points the installed @zkpassport/ui at a local zkpassport-packages checkout,
 * replacing the copy in node_modules with a symlink — so the verify button
 * under test is exactly the branch built there. The repo records nothing about
 * the local layout: package.json and bun.lock stay untouched, and a plain
 * `bun install` restores the registry/vendored copy (rerun this after it).
 *
 *   bun scripts/zkpassport-ui-link.ts <path-to-zkpassport-packages-checkout>
 *   bun scripts/zkpassport-ui-link.ts --unlink
 *
 * Rebuild the ui package in that checkout for changes to show up
 * (bunx turbo run build --filter=@zkpassport/ui), then restart the dev server.
 */
import { execFileSync } from "child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "fs";
import * as path from "path";

const repoRoot = path.resolve(import.meta.dirname, "../../..");
const installed = path.join(repoRoot, "node_modules", "@zkpassport", "ui");
const viteCache = path.join(repoRoot, "apps/web/node_modules/.vite");

const arg = process.argv[2];
if (!arg) {
  console.error(
    "usage: bun scripts/zkpassport-ui-link.ts <path-to-zkpassport-packages> | --unlink"
  );
  process.exit(1);
}

if (arg === "--unlink") {
  if (lstatSync(installed, { throwIfNoEntry: false })?.isSymbolicLink()) {
    rmSync(installed);
    console.log("link removed; run `bun install` to restore the vendored copy");
  } else {
    console.log("not linked; nothing to do");
  }
  process.exit(0);
}

// Accept the checkout root or the ui package dir itself
const candidate = path.resolve(arg);
const target = existsSync(
  path.join(candidate, "packages/zkpassport-ui/package.json")
)
  ? path.join(candidate, "packages/zkpassport-ui")
  : candidate;
const manifestPath = path.join(target, "package.json");
if (
  !existsSync(manifestPath) ||
  JSON.parse(readFileSync(manifestPath, "utf8")).name !== "@zkpassport/ui"
) {
  console.error(`no @zkpassport/ui package at ${target}`);
  process.exit(1);
}
if (!existsSync(path.join(target, "dist/esm/react-button.js"))) {
  console.error(`ui package at ${target} is not built; run there first:`);
  console.error("  bunx turbo run build --filter=@zkpassport/ui");
  process.exit(1);
}

rmSync(installed, { recursive: true, force: true });
mkdirSync(path.dirname(installed), { recursive: true });
symlinkSync(target, installed, "dir");
rmSync(viteCache, { recursive: true, force: true });

let describe = "";
try {
  describe = execFileSync(
    "git",
    ["-C", target, "rev-parse", "--short=8", "HEAD"],
    {
      encoding: "utf8",
    }
  ).trim();
} catch {
  // outside a git checkout; the link still works
}
console.log(`@zkpassport/ui -> ${target}${describe ? ` (${describe})` : ""}`);
console.log("vite dep cache cleared; restart the web dev server");
