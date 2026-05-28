/**
 * Errors related to the hashcash Web Worker. Defined in a platform-neutral
 * file so `instanceof` checks work regardless of whether the consuming code
 * resolved the `.web.ts`, `.native.ts`, or stub variant of the channel factory.
 */

/**
 * Thrown when the Web Worker itself fails (e.g. fails to boot because
 * `importScripts` can't resolve a bundled chunk). Without this, pending
 * `findProof` promises would hang silently and the solver would never
 * emit a `hashcashSolved` telemetry event.
 */
export class HashcashWorkerBootError extends Error {
  readonly originalEvent: unknown

  constructor(message: string, originalEvent?: unknown) {
    super(message)
    this.name = 'HashcashWorkerBootError'
    this.originalEvent = originalEvent
  }
}
