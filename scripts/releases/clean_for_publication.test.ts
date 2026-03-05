/**
 * Test file for the clean_for_publication script
 * Run with `bun test scripts/releases/clean_for_publication.test.ts`
 */
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  cleanForPublication,
  collectMatchingPaths,
  type FilesystemDeps,
  parseIgnoreFile,
} from "./clean_for_publication";

describe("clean_for_publication", () => {
  describe("parseIgnoreFile", () => {
    test("should parse ignore patterns from file", () => {
      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "*.log\n/dist\n!important.log"),
        existsSync: mock(() => true),
        readdirSync: mock(() => []),
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      const ig = parseIgnoreFile("/path/to/.publishignore", mockDeps);

      expect(mockDeps.readFileSync).toHaveBeenCalledWith(
        "/path/to/.publishignore",
        "utf-8",
      );
      expect(ig.ignores("test.log")).toBe(true);
      expect(ig.ignores("dist/file.js")).toBe(true);
      expect(ig.ignores("important.log")).toBe(false);
      expect(ig.ignores("src/index.ts")).toBe(false);
    });

    test("should handle comments and empty lines", () => {
      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "# Comment\n\n*.tmp\n"),
        existsSync: mock(() => true),
        readdirSync: mock(() => []),
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      const ig = parseIgnoreFile("/path/to/.publishignore", mockDeps);

      expect(ig.ignores("file.tmp")).toBe(true);
      expect(ig.ignores("file.txt")).toBe(false);
    });
  });

  describe("collectMatchingPaths", () => {
    test("should collect files matching patterns", () => {
      const mockEntries: fs.Dirent[] = [
        {
          name: "file.log",
          isDirectory: () => false,
          isFile: () => true,
        } as fs.Dirent,
        {
          name: "index.ts",
          isDirectory: () => false,
          isFile: () => true,
        } as fs.Dirent,
      ];

      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "*.log"),
        existsSync: mock(() => true),
        readdirSync: mock(() => mockEntries),
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      const ig = parseIgnoreFile("/root/.publishignore", mockDeps);
      const { files, dirs } = collectMatchingPaths("/root", ig, mockDeps);

      expect(files).toEqual(["/root/file.log"]);
      expect(dirs).toEqual([]);
    });

    test("should collect directories matching patterns", () => {
      const rootEntries: fs.Dirent[] = [
        {
          name: "dist",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
        {
          name: "src",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
      ];

      const readdirMock = mock((dir: string) => {
        if (dir === "/root") {
          return rootEntries;
        }
        // Return empty for any subdirectories (src will be recursed into)
        return [];
      });

      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "/dist"),
        existsSync: mock(() => true),
        readdirSync: readdirMock,
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      const ig = parseIgnoreFile("/root/.publishignore", mockDeps);

      const { files, dirs } = collectMatchingPaths("/root", ig, mockDeps);

      expect(dirs).toEqual(["/root/dist"]);
      expect(files).toEqual([]);
    });

    test("should skip excluded directories (node_modules, .git)", () => {
      const mockEntries: fs.Dirent[] = [
        {
          name: "node_modules",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
        {
          name: ".git",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
        {
          name: "src",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
      ];

      const readdirMock = mock((dir: string) => {
        if (dir === "/root") {
          return mockEntries;
        }
        if (dir === "/root/src") {
          return [];
        }
        return [];
      });

      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "**/*"),
        existsSync: mock(() => true),
        readdirSync: readdirMock,
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      const ig = parseIgnoreFile("/root/.publishignore", mockDeps);

      // Reset mock after parsing ignore file
      mockDeps.readdirSync = readdirMock;

      const { files, dirs } = collectMatchingPaths("/root", ig, mockDeps);

      // node_modules, .git should not be in the results
      expect(dirs).not.toContain("/root/node_modules");
      expect(dirs).not.toContain("/root/.git");
    });

    test("should handle nested directories", () => {
      const rootEntries: fs.Dirent[] = [
        {
          name: "src",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
      ];
      const srcEntries: fs.Dirent[] = [
        {
          name: "components",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
        {
          name: "test.log",
          isDirectory: () => false,
          isFile: () => true,
        } as fs.Dirent,
      ];
      const componentsEntries: fs.Dirent[] = [
        {
          name: "Button.tsx",
          isDirectory: () => false,
          isFile: () => true,
        } as fs.Dirent,
      ];

      const readdirMock = mock((dir: string) => {
        if (dir === "/root") {
          return rootEntries;
        }
        if (dir === "/root/src") {
          return srcEntries;
        }
        if (dir === "/root/src/components") {
          return componentsEntries;
        }
        return [];
      });

      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "*.log"),
        existsSync: mock(() => true),
        readdirSync: readdirMock,
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      const ig = parseIgnoreFile("/root/.publishignore", mockDeps);
      mockDeps.readdirSync = readdirMock;

      const { files, dirs } = collectMatchingPaths("/root", ig, mockDeps);

      expect(files).toEqual(["/root/src/test.log"]);
      expect(dirs).toEqual([]);
    });
  });

  describe("cleanForPublication", () => {
    test("should throw error if ignore file does not exist", () => {
      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => ""),
        existsSync: mock(() => false),
        readdirSync: mock(() => []),
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      expect(() =>
        cleanForPublication({
          rootDir: "/root",
          deps: mockDeps,
        }),
      ).toThrow("Ignore file not found");
    });

    test("should not delete files and directories when run in dry run mode", () => {
      const mockEntries: fs.Dirent[] = [
        {
          name: "file.log",
          isDirectory: () => false,
          isFile: () => true,
        } as fs.Dirent,
        {
          name: "dist",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
      ];

      const unlinkMock = mock(() => {});
      const rmMock = mock(() => {});

      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "*.log\n/dist"),
        existsSync: mock(() => true),
        readdirSync: mock(() => mockEntries),
        rmSync: rmMock,
        unlinkSync: unlinkMock,
      };

      const result = cleanForPublication({
        rootDir: "/root",
        dryRun: true,
        deps: mockDeps,
      });

      expect(result.deletedFiles).toEqual(["/root/file.log"]);
      expect(result.deletedDirs).toEqual(["/root/dist"]);
      expect(unlinkMock).not.toHaveBeenCalled();
      expect(rmMock).not.toHaveBeenCalled();
    });

    test("should actually delete files and directories when not in dry run mode", () => {
      const mockEntries: fs.Dirent[] = [
        {
          name: "file.log",
          isDirectory: () => false,
          isFile: () => true,
        } as fs.Dirent,
        {
          name: "dist",
          isDirectory: () => true,
          isFile: () => false,
        } as fs.Dirent,
      ];

      const unlinkMock = mock(() => {});
      const rmMock = mock(() => {});

      const mockDeps: FilesystemDeps = {
        readFileSync: mock(() => "*.log\n/dist"),
        existsSync: mock(() => true),
        readdirSync: mock(() => mockEntries),
        rmSync: rmMock,
        unlinkSync: unlinkMock,
      };

      const result = cleanForPublication({
        rootDir: "/root",
        dryRun: false,
        deps: mockDeps,
      });

      expect(result.deletedFiles).toEqual(["/root/file.log"]);
      expect(result.deletedDirs).toEqual(["/root/dist"]);
      expect(unlinkMock).toHaveBeenCalledWith("/root/file.log");
      expect(rmMock).toHaveBeenCalledWith("/root/dist", { recursive: true });
    });

    test("should use custom ignore file when specified", () => {
      const readFileMock = mock(() => "");

      const mockDeps: FilesystemDeps = {
        readFileSync: readFileMock,
        existsSync: mock(() => true),
        readdirSync: mock(() => []),
        rmSync: mock(() => {}),
        unlinkSync: mock(() => {}),
      };

      cleanForPublication({
        rootDir: "/root",
        ignoreFile: ".custom-ignore",
        deps: mockDeps,
      });

      expect(readFileMock).toHaveBeenCalledWith(
        "/root/.custom-ignore",
        "utf-8",
      );
    });
  });

  describe("integration tests with real filesystem", () => {
    const testDir = path.join(process.cwd(), ".test-clean-for-publication");

    beforeEach(() => {
      // Create test directory structure
      fs.mkdirSync(testDir, { recursive: true });
      fs.mkdirSync(path.join(testDir, "src"), { recursive: true });
      fs.mkdirSync(path.join(testDir, "dist"), { recursive: true });
      fs.mkdirSync(path.join(testDir, "node_modules", "package"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(testDir, ".git"), { recursive: true });

      fs.writeFileSync(path.join(testDir, "src", "index.ts"), "export {}");
      fs.writeFileSync(
        path.join(testDir, "src", "Button.stories.tsx"),
        "export {}",
      );
      fs.writeFileSync(
        path.join(testDir, "dist", "index.js"),
        "module.exports = {}",
      );
      fs.writeFileSync(path.join(testDir, ".env.local"), "SECRET=123");
      fs.writeFileSync(path.join(testDir, ".env.defaults"), "PUBLIC=abc");
      fs.writeFileSync(
        path.join(testDir, "node_modules", "package", "index.js"),
        "",
      );
      fs.writeFileSync(path.join(testDir, ".git", "config"), "");
      fs.writeFileSync(
        path.join(testDir, ".publishignore"),
        `# Test ignore file
**/*.stories.tsx
/dist
/.env*
!/.env.defaults
`,
      );
    });

    afterEach(() => {
      // Clean up test directory
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }
    });

    test("should delete matching files and directories", () => {
      const result = cleanForPublication({
        rootDir: testDir,
        ignoreFile: ".publishignore",
      });

      // Should have deleted the matching files
      expect(
        result.deletedFiles.map((f) => path.relative(testDir, f)).sort(),
      ).toEqual([".env.local", "src/Button.stories.tsx"].sort());
      expect(result.deletedDirs.map((d) => path.relative(testDir, d))).toEqual([
        "dist",
      ]);

      // Verify files are actually deleted
      expect(fs.existsSync(path.join(testDir, ".env.local"))).toBe(false);
      expect(
        fs.existsSync(path.join(testDir, "src", "Button.stories.tsx")),
      ).toBe(false);
      expect(fs.existsSync(path.join(testDir, "dist"))).toBe(false);

      // Verify non-matching files still exist
      expect(fs.existsSync(path.join(testDir, "src", "index.ts"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, ".env.defaults"))).toBe(true);

      // Verify excluded directories were not traversed/deleted
      expect(
        fs.existsSync(
          path.join(testDir, "node_modules", "package", "index.js"),
        ),
      ).toBe(true);
      expect(fs.existsSync(path.join(testDir, ".git", "config"))).toBe(true);
    });

    test("should not delete anything in dry run mode", () => {
      const result = cleanForPublication({
        rootDir: testDir,
        ignoreFile: ".publishignore",
        dryRun: true,
      });

      // Should report what would be deleted
      expect(result.deletedFiles.length).toBeGreaterThan(0);
      expect(result.deletedDirs.length).toBeGreaterThan(0);

      // But files should still exist
      expect(fs.existsSync(path.join(testDir, ".env.local"))).toBe(true);
      expect(
        fs.existsSync(path.join(testDir, "src", "Button.stories.tsx")),
      ).toBe(true);
      expect(fs.existsSync(path.join(testDir, "dist"))).toBe(true);
    });
  });
});
