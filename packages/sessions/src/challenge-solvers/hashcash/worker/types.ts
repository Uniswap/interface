import type { HashcashChallenge, ProofResult } from '@universe/sessions/src/challenge-solvers/hashcash/core'

/**
 * Parameters for finding a hashcash proof
 */
interface FindProofParams {
  challenge: HashcashChallenge
  rangeStart?: number
  rangeSize?: number
}

/**
 * Context for creating a hashcash worker channel.
 * Apps inject the Worker instance getter to control Worker instantiation.
 */
interface CreateHashcashWorkerChannelContext {
  /**
   * Returns a Worker instance for hashcash proof-of-work.
   * Called once on first channel creation (singleton pattern).
   */
  getWorker: () => Worker
}

/**
 * The API exposed by the hashcash worker.
 * This is the contract between main thread and worker.
 */
interface HashcashWorkerAPI {
  /**
   * Find a proof-of-work solution for the given challenge.
   * Returns null if no solution found within range or if cancelled.
   */
  findProof(params: FindProofParams): Promise<ProofResult | null>

  /**
   * Cancel any in-progress proof search.
   */
  cancel(): Promise<void>
}

/**
 * A channel to communicate with a hashcash worker.
 * Platform-specific implementations create these.
 */
interface HashcashWorkerChannel {
  /**
   * The worker API - call methods to execute on worker thread
   */
  api: HashcashWorkerAPI

  /**
   * Terminate the worker and clean up resources
   */
  terminate(): void
}

/**
 * Factory function that creates a HashcashWorkerChannel.
 * Injected into the solver to enable platform-specific implementations.
 */
type HashcashWorkerChannelFactory = () => HashcashWorkerChannel

export type {
  CreateHashcashWorkerChannelContext,
  FindProofParams,
  HashcashWorkerAPI,
  HashcashWorkerChannel,
  HashcashWorkerChannelFactory,
}
