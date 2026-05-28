/**
 * Vite-specific variant of the hashcash Web Worker factory. Used ONLY by WXT/Vite
 * builds via an alias override in `wxt.config.ts`. Webpack is unaware of this file
 * and falls through to `hashcashWorker.ts` (which uses the `new Worker(new URL())`
 * pattern that webpack handles correctly).
 *
 * Why two files: Vite's `new Worker(new URL(literal, import.meta.url))` detection
 * does not fire when the URL path escapes the Vite root (here, crossing from
 * `apps/extension/` into `packages/sessions/`). Vite's `?worker` URL query is an
 * explicit signal that bypasses that restriction, but it's Vite-only syntax that
 * webpack would silently strip and then mis-handle as a regular import.
 */

// oxlint-disable-next-line import/default -- Vite ?worker virtual module; linter can't resolve the default export
import HashcashWorker from '@universe/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts?worker'

export function createHashcashWorker(): Worker {
  return new HashcashWorker()
}
