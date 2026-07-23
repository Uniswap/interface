import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

interface UseRealTokenMarketInfoParams {
  tokenAddress?: string
  chainId?: UniverseChainId
  skip?: boolean
}

interface RealTokenMarketInfo {
  fdvUsd: number | undefined
  name: string | undefined
  loading: boolean
}

/**
 * Fetches a real (redeemable) token's indexed market data for the Token Launched Banner: its
 * name and fully-diluted valuation, from the same GraphQL source the token details page uses.
 *
 * Used when an auction's virtual token is redeemable, so the banner can present the real token's
 * own name + FDV (its price x its own total supply) instead of recomputing FDV from the virtual
 * token's clearing price and supply.
 */
export function useRealTokenMarketInfo({
  tokenAddress,
  chainId,
  skip = false,
}: UseRealTokenMarketInfoParams): RealTokenMarketInfo {
  const chain = chainId ? toGraphQLChain(chainId) : undefined

  const { data, loading } = GraphQLApi.useTokenWebQuery({
    variables: { chain: chain ?? GraphQLApi.Chain.Ethereum, address: tokenAddress },
    skip: skip || !chain || !tokenAddress,
  })

  return useMemo(() => {
    const token = data?.token
    return {
      // Project market [0] is the aggregated USD market — same source as `useTokenMarketStats`.
      fdvUsd: token?.project?.markets?.[0]?.fullyDilutedValuation?.value ?? undefined,
      name: token?.name ?? token?.project?.name ?? undefined,
      loading,
    }
  }, [data?.token, loading])
}
