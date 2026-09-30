import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenMarketsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getGetTokenMarketsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { useTokenMetadata } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

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

// Token.fdv on GetToken is unset for EVM tokens, so FDV comes from GetTokenMarkets like the TDP.
function selectFdvUsd(data: PlainMessage<GetTokenMarketsResponse> | undefined): number | undefined {
  return data?.markets[0]?.stats?.fullyDilutedValuationUsd
}

/**
 * Fetches a real (redeemable) token's indexed market data for the Token Launched Banner: its
 * name and fully-diluted valuation, from the same V2 sources the token details page uses.
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
  const currencyId = !skip && chainId && tokenAddress ? buildCurrencyId(chainId, tokenAddress) : undefined

  const { name, isLoading: metadataLoading } = useTokenMetadata(currencyId)

  // Same params as useTokenMarketStats so the request shares the TDP's cache entry.
  const marketsParams = useMemo(
    () =>
      currencyId ? { tokens: [currencyIdToRestContractInput(currencyId)], duration: HistoryDuration.DAY } : undefined,
    [currencyId],
  )
  const { data: fdvUsd, isLoading: fdvLoading } = useQuery(
    getGetTokenMarketsQueryOptions({ params: marketsParams, select: selectFdvUsd }),
  )

  return { fdvUsd, name, loading: metadataLoading || fdvLoading }
}
