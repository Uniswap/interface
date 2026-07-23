import { type CreateContract, createContract } from './createContract'

export interface Contracts {
  createContract: CreateContract
}

/**
 * Factory for contract-level handles.
 *
 * @param ctx - Context w/ a getViemEnabled callback
 * @returns Set of supported contract factories
 */
export function createContracts(ctx: { getViemEnabled: () => boolean }): Contracts {
  return {
    createContract: createContract(ctx),
  }
}
