import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenContract } from '~/hooks/useContract'

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
  const tokenContract = useTokenContract({
    tokenAddress,
    withSignerIfPossible: false,
    chainId,
  })

  const {
    data: tokenMetadata,
    isLoading,
    error,
  } = useQuery({
    queryKey: [chainId, tokenAddress],
    queryFn: async (): Promise<TokenMetadata> => {
      if (!tokenContract) {
        throw new Error('Token contract not available')
      }

      try {
        // Fetch all token metadata in parallel
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
        ])

        return {
          name,
          symbol,
          decimals,
        }
      } catch (err) {
        throw new Error(`Failed to fetch token metadata: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    },
    enabled: Boolean(tokenContract && tokenAddress && chainId),
    staleTime: 1000 * 60 * 60, // 1 hour - token metadata rarely changes
    retry: 2,
  })

  return useMemo(
    () => ({
      tokenMetadata,
      loading: isLoading,
      error: error as Error | null,
    }),
    [tokenMetadata, isLoading, error],
  )
}
