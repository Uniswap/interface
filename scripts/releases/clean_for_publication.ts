#!/usr/bin/env bun

/**
 * Clean for Publication Script
 *
 * This script cleans all files from the repository that match patterns in .publishignore
 * for public release. It walks through the directory tree and deletes files and directories
 * that should not be included in public releases.
 *
 * Usage:
 *   bun scripts/releases/clean_for_publication.ts
 *   bun scripts/releases/clean_for_publication.ts --dry-run
 *   bun scripts/releases/clean_for_publication.ts --ignore-file /path/to/ignore-file
 *   bun scripts/releases/clean_for_publication.ts --root /path/to/repo
 */

import fs from "node:fs";
import path from "node:path";
import ignore, { type Ignore } from "ignore";

// Directories to always exclude from traversal
const EXCLUDED_DIRS = new Set(["node_modules", ".git"]);

// Default ignore file name
const DEFAULT_IGNORE_FILE = ".publishignore";

export interface FilesystemDeps {
  readFileSync: (path: string, encoding: BufferEncoding) => string;
  existsSync: (path: string) => boolean;
  readdirSync: (path: string, options: { withFileTypes: true }) => fs.Dirent[];
  rmSync: (path: string, options?: fs.RmOptions) => void;
  unlinkSync: (path: string) => void;
}

export interface CleanForPublicationOptions {
  rootDir?: string;
  ignoreFile?: string;
  dryRun?: boolean;
  deps?: FilesystemDeps;
}

export interface CleanResult {
  deletedFiles: string[];
  deletedDirs: string[];
}

const productionDeps: FilesystemDeps = {
  readFileSync: fs.readFileSync,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  rmSync: fs.rmSync,
  unlinkSync: fs.unlinkSync,
};

/**
 * Parse the ignore file and return an Ignore instance
 */
export function parseIgnoreFile(
  ignoreFilePath: string,
  deps: FilesystemDeps,
): Ignore {
  const content = deps.readFileSync(ignoreFilePath, "utf-8");
  const ig = ignore();
  ig.add(content);
  return ig;
}

/**
 * Recursively walk through directories and collect files/dirs that match the ignore patterns
 */
export function collectMatchingPaths(
  rootDir: string,
  ig: Ignore,
  deps: FilesystemDeps,
): { files: string[]; dirs: string[] } {
  const files: string[] = [];
  const dirs: string[] = [];

  function walk(currentDir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = deps.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      // Get path relative to root for pattern matching
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        // Skip excluded directories
        if (EXCLUDED_DIRS.has(entry.name)) {
          continue;
        }

        // Check if directory matches ignore patterns
        // For directories, we need to check with trailing slash for gitignore semantics
        if (ig.ignores(relativePath) || ig.ignores(relativePath + "/")) {
          dirs.push(fullPath);
          // Don't recurse into matched directories as they'll be deleted entirely
        } else {
          // Recurse into non-matched directories
          walk(fullPath);
        }
      } else {
        // Check if file matches ignore patterns
        if (ig.ignores(relativePath)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(rootDir);
  return { files, dirs };
}

/**
 * Main function to clean files for publication
 */
export function cleanForPublication(
  options: CleanForPublicationOptions = {},
): CleanResult {
  const deps = options.deps ?? productionDeps;
  const rootDir = options.rootDir ?? process.cwd();
  const ignoreFile = options.ignoreFile ?? DEFAULT_IGNORE_FILE;
  const dryRun = options.dryRun ?? false;

  const ignoreFilePath = path.join(rootDir, ignoreFile);

  console.log("Cleaning all files from repository for public release");

  if (!deps.existsSync(ignoreFilePath)) {
    throw new Error(`Ignore file not found: ${ignoreFilePath}`);
  }

  // Parse the ignore file
  const ig = parseIgnoreFile(ignoreFilePath, deps);

  // Collect all matching files and directories
  const { files, dirs } = collectMatchingPaths(rootDir, ig, deps);

  console.log(
    `Found a total of ${dirs.length} directories and ${files.length} files to delete`,
  );

  // Sort by path length descending (longest first) to delete nested items first
  const sortedFiles = [...files].sort((a, b) => b.length - a.length);
  const sortedDirs = [...dirs].sort((a, b) => b.length - a.length);

  const deletedFiles: string[] = [];
  const deletedDirs: string[] = [];

  // Delete files first
  for (const filePath of sortedFiles) {
    console.log(
      `${dryRun ? "[DRY RUN] Would delete" : "Deleting"} file ${filePath}`,
    );
    if (!dryRun) {
      deps.unlinkSync(filePath);
    }
    deletedFiles.push(filePath);
  }

  // Delete directories
  for (const dirPath of sortedDirs) {
    console.log(
      `${dryRun ? "[DRY RUN] Would delete" : "Deleting"} directory ${dirPath}`,
    );
    if (!dryRun) {
      deps.rmSync(dirPath, { recursive: true });
    }
    deletedDirs.push(dirPath);
  }

  console.log("Repo successfully sanitized");

  return { deletedFiles, deletedDirs };
}

/**
 * Parse command line arguments
 */
function parseArgs(): CleanForPublicationOptions {
  const args = process.argv.slice(2);
  const options: CleanForPublicationOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--root" && args[i + 1]) {
      options.rootDir = args[++i];
    } else if (arg === "--ignore-file" && args[i + 1]) {
      options.ignoreFile = args[++i];
    }
  }

  return options;
}

// Run if executed directly
if (import.meta.main) {
  const options = parseArgs();
  cleanForPublication(options);
}
