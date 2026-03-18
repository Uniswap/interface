#!/usr/bin/env bun

/**
 * Copy Public Files Script
 *
 * This script copies files from the public/ directory to their destinations
 * based on public/files.json.
 *
 * Usage:
 *   bun scripts/releases/copy_public_files.ts
 *   bun scripts/releases/copy_public_files.ts --dry-run
 *   bun scripts/releases/copy_public_files.ts --root /path/to/repo
 */

import fs from "node:fs";
import path from "node:path";

export interface FilesystemDeps {
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string, options?: fs.MakeDirectoryOptions) => void;
  copyFileSync: (src: string, dest: string) => void;
}

export interface CopyPublicFilesOptions {
  rootDir?: string;
  dryRun?: boolean;
  deps?: FilesystemDeps;
}

export interface CopyResult {
  copiedFiles: Array<{ src: string; dest: string }>;
}

const productionDeps: FilesystemDeps = {
  readFileSync: fs.readFileSync,
  existsSync: fs.existsSync,
  mkdirSync: fs.mkdirSync,
  copyFileSync: fs.copyFileSync,
};

/**
 * Main function to copy public files to their destinations
 */
export function copyPublicFiles(
  options: CopyPublicFilesOptions = {},
): CopyResult {
  const deps = options.deps ?? productionDeps;
  const rootDir = options.rootDir ?? process.cwd();
  const dryRun = options.dryRun ?? false;

  const filesJsonPath = path.join(rootDir, "public", "files.json");

  console.log("Starting file copying");

  if (!deps.existsSync(filesJsonPath)) {
    throw new Error(`files.json not found: ${filesJsonPath}`);
  }

  console.log("Reading files.json");
  const filesJsonContent = deps.readFileSync(filesJsonPath, "utf-8");
  const filesJson: Record<string, string> = JSON.parse(filesJsonContent);

  console.log("Copying files");
  const copiedFiles: Array<{ src: string; dest: string }> = [];

  for (const [file, dest] of Object.entries(filesJson)) {
    const srcPath = path.join(rootDir, "public", file);
    const destPath = path.join(rootDir, dest);
    const destDir = path.dirname(destPath);

    if (dryRun) {
      console.log(`[DRY RUN] Would copy ${srcPath} -> ${destPath}`);
    } else {
      if (destDir) {
        deps.mkdirSync(destDir, { recursive: true });
      }
      console.log(`Copying ${srcPath} -> ${destPath}`);
      deps.copyFileSync(srcPath, destPath);
    }

    copiedFiles.push({ src: srcPath, dest: destPath });
  }

  console.log("File copying complete");

  return { copiedFiles };
}

/**
 * Parse command line arguments
 */
function parseArgs(): CopyPublicFilesOptions {
  const args = process.argv.slice(2);
  const options: CopyPublicFilesOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--root" && args[i + 1]) {
      options.rootDir = args[++i];
    }
  }

  return options;
}

// Run if executed directly
if (import.meta.main) {
  const options = parseArgs();
  copyPublicFiles(options);
}
