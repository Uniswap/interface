/**
 * Default hashcash Web Worker factory, used by Jest. The WXT/Vite build aliases
 * `src/workers/hashcashWorker` to `hashcashWorker.vite.ts` (see wxt.config.ts), so this
 * `new Worker(new URL())` variant only runs where the `?worker` query can't (i.e. Jest).
 *
 * The relative path crosses into `packages/sessions/src/...` at the monorepo root and
 * resolves to the same worker source the Vite variant loads.
 */
export function createHashcashWorker(): Worker {
  return new Worker(
    new URL('../../../../packages/sessions/src/challenge-solvers/hashcash/worker/hashcash.worker.ts', import.meta.url),
    { type: 'module' },
  )
}
