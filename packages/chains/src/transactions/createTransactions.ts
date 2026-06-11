import { type SignTypedData, createSignTypedData } from './createSignTypedData'

export interface Transactions {
  signTypedData: SignTypedData
}

/**
 * Factory for transaction-level, business logic.
 *
 * @param ctx - Context w/ a getViemEnabled callback
 * @returns Set of supported transaction functions
 */
export function createTransactions(ctx: { getViemEnabled: () => boolean }): Transactions {
  return {
    signTypedData: createSignTypedData(ctx),
  }
}
