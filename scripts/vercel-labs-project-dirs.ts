/**
 * Directories whose changes require a redeploy, for each labs/ project
 * outside the NX graph (experimental, .nxignore'd).
 *
 * Single source of truth shared by scripts/vercel-ignore.ts (Vercel Ignored
 * Build Step) and scripts/vercel-affected.ts (CI affected detection) — a
 * drifted entry silently stops or wastes deploys for a labs project.
 */
export const labsProjectDirs: Record<string, string[]> = {
  '@universe/sandbox': ['labs/sandbox/'],
  // workbench renders @universe/mycelium components, so mycelium changes must redeploy it
  '@universe/workbench': ['labs/workbench/', 'packages/mycelium/'],
}
