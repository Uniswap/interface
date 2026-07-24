/**
 * WXT/Vite production variant of the hashcash Web Worker factory. The alias in
 * `wxt.config.ts` routes `src/workers/hashcashWorker` here for Vite builds.
 *
 * Uses Vite's `?worker` query, which bundles the worker even though its source escapes
 * the Vite root (crossing from `apps/extension/` into `packages/sessions/`). The plain
 * `new Worker(new URL())` variant in `hashcashWorker.ts` does not bundle correctly here.
 */

// oxlint-disable-next-line import/default, no-restricted-imports -- Vite ?worker virtual module (linter can't resolve the default export); worker files are intentionally not exported from the @universe/sessions root — Vite's worker transform only fires on app-tree imports
import HashcashWorker from '@universe/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts?worker'

export function createHashcashWorker(): Worker {
  return new HashcashWorker()
}
