import { isDelegatedEOA } from 'uniswap/src/features/smartWallet/delegation/isDelegatedEOA'
import { ensure0xHex } from 'uniswap/src/utils/hex'
import type { Logger } from 'utilities/src/logger/logger'

export function createDelegationService(ctx: {
  logger?: Logger
  delegationRepository: DelegationRepository
  onDelegationDetected?: (input: { address: Address; chainId: number }) => void
}): DelegationService {
  return {
    getIsAddressDelegated: async (input: { address: Address; chainId: number }): Promise<DelegatedResult> => {
      const bytecode = ensure0xHex(await ctx.delegationRepository.getWalletBytecode(input))
      ctx.logger?.info(
        'delegation.ts',
        'getIsAddressDelegated',
        `Checking if address ${input.address} is delegated on chain ${input.chainId}`,
        {
          bytecode,
        },
      )
      const isDelegatedEOAOutput = isDelegatedEOA({
        bytecode,
      })
      if (isDelegatedEOAOutput.isDelegated && isDelegatedEOAOutput.delegateTo) {
        ctx.onDelegationDetected?.({ address: isDelegatedEOAOutput.delegateTo, chainId: input.chainId })
        ctx.logger?.info(
          'delegation.ts',
          'getIsAddressDelegated',
          `Address ${input.address} is delegated on chain ${input.chainId} to ${isDelegatedEOAOutput.delegateTo}`,
        )
        return {
          isDelegated: true,
          delegatedAddress: isDelegatedEOAOutput.delegateTo,
        }
      } else {
        return {
          isDelegated: false,
          delegatedAddress: null,
        }
      }
    },
  }
}

export type DelegatedResult =
  | {
      isDelegated: true
      delegatedAddress: Address
    }
  | {
      isDelegated: false
      delegatedAddress: null
    }

export interface DelegationService {
  getIsAddressDelegated: (input: { address: Address; chainId: number }) => Promise<DelegatedResult>
}

export interface DelegationRepository {
  getWalletBytecode: (input: { address: Address; chainId: number }) => Promise<string>
}
