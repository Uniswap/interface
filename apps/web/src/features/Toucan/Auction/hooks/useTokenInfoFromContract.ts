import ms from 'ms'
import { useMemo } from 'react'
import { EVMUniverseChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { useReadContracts } from 'wagmi'
import { erc20Abi } from '~/chains'
import { assume0xAddress } from '~/utils/wagmi'

interface TokenMetadata {
  name?: string
  symbol?: string
  decimals?: number
}

/**
 * Fetches token metadata directly from the blockchain via RPC calls.
 * This is used as a fallback when the GraphQL API doesn't have token data.
 *
 * @param tokenAddress - The token contract address
 * @param chainId - The chain ID where the token exists
 * @returns Token metadata with loading and error states
 */
export function useTokenInfoFromContract(
  tokenAddress?: string,
  chainId?: UniverseChainId,
): {
  tokenMetadata: TokenMetadata | undefined
  loading: boolean
  error: Error | null
} {
  const enabled = Boolean(tokenAddress && chainId)
  const address = assume0xAddress(tokenAddress)
  // ERC20 metadata only exists on EVM chains; narrow.
  // We don't support/consider Solana (metadata).
  const evmChainId = chainId as EVMUniverseChainId | undefined

  const { data, isLoading, error } = useReadContracts({
    contracts: [
      { address, chainId: evmChainId, abi: erc20Abi, functionName: 'name' },
      { address, chainId: evmChainId, abi: erc20Abi, functionName: 'symbol' },
      { address, chainId: evmChainId, abi: erc20Abi, functionName: 'decimals' },
    ],
    // Token metadata rarely changes; cache and retry failures.
    query: { enabled, staleTime: ms('1hr'), retry: 2 },
  })

  return useMemo(() => {
    const tokenMetadata: TokenMetadata | undefined = data
      ? {
          name: data[0].result,
          symbol: data[1].result,
          decimals: data[2].result,
        }
      : undefined

    return {
      tokenMetadata,
      loading: isLoading,
      error: (error as Error | null) ?? null,
    }
  }, [data, isLoading, error])
}
