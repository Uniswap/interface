import type { BigNumberish } from '@ethersproject/bignumber'
import type { Address } from 'viem'
import type {
  decodeFunctionResult as viemDecodeFunctionResult,
  encodeFunctionData as viemEncodeFunctionData,
} from 'viem'
import { createDecodeFunctionResult } from './createDecodeFunctionResult'
import { createEncodeFunctionData } from './createEncodeFunctionData'
import { formatUnits } from './createFormatUnits'
import { getAddress } from './createGetAddress'
import { createIsAddress } from './createIsAddress'
import { createNamehash } from './createNamehash'
import { parseEther } from './createParseEther'
import { createParseUnits } from './createParseUnits'
import { toBigInt } from './createToBigInt'
import { zeroAddress } from './createZeroAddress'

export interface Utilities {
  decodeFunctionResult: typeof viemDecodeFunctionResult
  encodeFunctionData: typeof viemEncodeFunctionData
  formatUnits: (value: bigint, decimals: number) => string
  getAddress: (value: string) => Address
  isAddress: (value: string) => value is Address
  namehash: (name: string) => string
  parseEther: (value: string) => bigint
  parseUnits: (value: string, decimals: number) => bigint
  toBigInt: (value: BigNumberish) => bigint
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
    decodeFunctionResult: createDecodeFunctionResult(ctx),
    encodeFunctionData: createEncodeFunctionData(ctx),
    formatUnits,
    getAddress,
    isAddress: createIsAddress(ctx),
    namehash: createNamehash(ctx),
    parseEther,
    parseUnits: createParseUnits(ctx),
    toBigInt,
    zeroAddress,
  }
}
