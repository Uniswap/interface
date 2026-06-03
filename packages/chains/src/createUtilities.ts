import type { Address } from 'viem'
import { formatUnits } from './createFormatUnits'
import { getAddress } from './createGetAddress'
import { createIsAddress } from './createIsAddress'
import { createNamehash } from './createNamehash'
import { createParseUnits } from './createParseUnits'
import { zeroAddress } from './createZeroAddress'

export interface Utilities {
  formatUnits: (value: bigint, decimals: number) => string
  getAddress: (value: string) => Address
  isAddress: (value: string) => value is Address
  namehash: (name: string) => string
  parseUnits: (value: string, decimals: number) => bigint
  zeroAddress: Address
}

/**
 * Factory for initializing a set of chain utilities, pure
 * functions, and constants useful for creating transactions
 *
 * @param ctx - Context w/ a getViemEnabled callback
 * @returns Set of supported chain utilities
 */
export function createUtilities(ctx: { getViemEnabled: () => boolean }): Utilities {
  return {
    formatUnits,
    getAddress,
    isAddress: createIsAddress(ctx),
    namehash: createNamehash(ctx),
    parseUnits: createParseUnits(ctx),
    zeroAddress,
  }
}
