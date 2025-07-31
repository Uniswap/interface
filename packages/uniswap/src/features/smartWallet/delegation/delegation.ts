import type {
  ChainDelegatedResults,
  DelegatedResult,
  DelegationRepository,
} from 'uniswap/src/features/smartWallet/delegation/delegationRepository'
import type { Logger } from 'utilities/src/logger/logger'

export type Address = string

const NON_DELEGATED_RESULT: DelegatedResult = {
  isDelegated: false,
  delegatedAddress: null,
}

/**
 * Creates a delegation service that can be used to check if a wallet is delegated to a smart wallet.
 * @param ctx - The context object containing the logger and delegation repository.
 * @returns A delegation service that can be used to check if a wallet is delegated to a smart wallet.
 */
export function createDelegationService(ctx: {
  logger?: Logger
  delegationRepository: DelegationRepository
  onDelegationDetected?: (input: { address: Address; chainId: number }) => void
}): DelegationService {
  /**
   * Gets the delegation status for a given address on multiple chains.
   * @param input - The input object containing the address and chain IDs.
   * @returns A map of chain IDs to delegation results.
   */
  const getAddressDelegations: DelegationService['getAddressDelegations'] = async (input) => {
    const chainDelegatedResults: ChainDelegatedResults = {}

    try {
      ctx.logger?.debug(
        'delegation.ts',
        'getAddressDelegations',
        `Checking if address ${input.address} is delegated on chains ${input.chainIds.join(', ')}`,
      )
      const result = await ctx.delegationRepository.getWalletDelegations({
        address: input.address,
        chainIds: input.chainIds,
      })

      for (const chainId of input.chainIds) {
        const delegationInfo = result[String(chainId)]
        if (!delegationInfo || !delegationInfo.currentDelegationAddress) {
          chainDelegatedResults[String(chainId)] = NON_DELEGATED_RESULT
          continue
        }

        ctx.onDelegationDetected?.({
          address: delegationInfo.currentDelegationAddress,
          chainId,
        })

        ctx.logger?.debug(
          'delegation.ts',
          'getAddressDelegations',
          `Address ${input.address} is delegated on chain ${chainId}`,
          {
            isWalletDelegatedToUniswap: delegationInfo.isWalletDelegatedToUniswap,
            latestDelegationAddress: delegationInfo.latestDelegationAddress,
          },
        )

        chainDelegatedResults[String(chainId)] = {
          isDelegated: true,
          delegatedAddress: delegationInfo.currentDelegationAddress,
        }
      }

      return chainDelegatedResults
    } catch (error) {
      ctx.logger?.error(error, {
        tags: { file: 'delegation.ts', function: 'getAddressDelegations' },
        extra: { address: input.address, chainIds: input.chainIds },
      })
      return chainDelegatedResults
    }
  }

  /**
   * Checks if a wallet is delegated to a smart wallet on a given chain.
   * @param input - The input object containing the wallet address and chain ID.
   * @returns A result that indicates whether the wallet is delegated to a smart wallet and the address of the smart wallet (if applicable)
   */
  const getIsAddressDelegated: DelegationService['getIsAddressDelegated'] = async (input) => {
    ctx.logger?.debug(
      'delegation.ts',
      'getIsAddressDelegated',
      `Checking if address ${input.address} is delegated on chain ${input.chainId}`,
    )

    try {
      const chainDelegatedResults = await getAddressDelegations({
        address: input.address,
        chainIds: [input.chainId],
      })
      return chainDelegatedResults[String(input.chainId)] ?? NON_DELEGATED_RESULT
    } catch (error) {
      ctx.logger?.error(error, {
        tags: { file: 'delegation.ts', function: 'getIsAddressDelegated' },
        extra: { address: input.address, chainId: input.chainId },
      })
      // Return not delegated on error to maintain backward compatibility
      return NON_DELEGATED_RESULT
    }
  }
  return {
    getIsAddressDelegated,
    getAddressDelegations,
  }
}

export interface DelegationService {
  getIsAddressDelegated: (input: { address: Address; chainId: number }) => Promise<DelegatedResult>
  getAddressDelegations: (input: { address: Address; chainIds: number[] }) => Promise<ChainDelegatedResults>
}
