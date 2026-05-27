/**
 * Factory that creates a hashcash proof-of-work Web Worker for this extension.
 *
 * This file lives inside `apps/extension/src/` — not in `packages/sessions` — because
 * Vite's `new Worker(new URL(literal, import.meta.url), ...)` detection only reliably
 * bundles worker files when the pattern appears in the consuming app's own source tree.
 * When placed inside a workspace package, Vite leaves the URL as a literal path and
 * the worker fails to load at runtime. Webpack handles the pattern correctly in either
 * location; the app-local placement keeps both bundlers happy.
 *
 * Relative path from `apps/extension/src/workers/` crosses into `packages/sessions/src/...`
 * at the monorepo root. This produces the same `hashcash.worker.js` chunk in both webpack
 * (via its `new URL(import.meta.url)` handling) and Vite (via its worker URL plugin).
 */
export function createHashcashWorker(): Worker {
  return new Worker(
    /* webpackChunkName: "hashcash-worker" */
    new URL('../../../../packages/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts', import.meta.url),
    { type: 'module' },
  )
}
