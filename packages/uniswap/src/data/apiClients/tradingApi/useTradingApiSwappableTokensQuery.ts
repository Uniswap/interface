import { QueryFunction, QueryKey, UseQueryResult, skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TRADING_API_CACHE_KEY, fetchSwappableTokens } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { ChainId, GetSwappableTokensResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import {
  getTokenAddressFromChainForTradingApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { logger } from 'utilities/src/logger/logger'

export type SwappableTokensParams = {
  tokenIn: Address
  tokenInChainId: ChainId
  tokenOut?: Address
  tokenOutChainId?: ChainId
}

export function useTradingApiSwappableTokensQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  SwappableTokensParams,
  GetSwappableTokensResponse
>): UseQueryResult<GetSwappableTokensResponse> {
  const queryKey = swappableTokensQueryKey(params)

  return useQuery<GetSwappableTokensResponse>({
    queryKey,
    queryFn: params ? swappableTokensQueryFn(params) : skipToken,
    ...rest,
  })
}

export function usePrefetchSwappableTokens(input: Maybe<TradeableAsset>): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    const prefetchSwappableTokens = async (): Promise<void> => {
      const tokenIn = input?.address ? getTokenAddressFromChainForTradingApi(input.address, input.chainId) : undefined
      const tokenInChainId = toTradingApiSupportedChainId(input?.chainId)
      if (!tokenIn || !tokenInChainId) {
        return
      }

      await queryClient.prefetchQuery({
        queryKey: swappableTokensQueryKey({
          tokenIn,
          tokenInChainId,
        }),
        queryFn: swappableTokensQueryFn({
          tokenIn,
          tokenInChainId,
        }),
      })
    }

    prefetchSwappableTokens().catch((e) => {
      logger.error(e, {
        tags: { file: 'useTradingApiSwappableTokensQuery', function: 'prefetchSwappableTokens' },
      })
    })
  }, [input, queryClient])
}

const swappableTokensQueryKey = (params?: SwappableTokensParams): QueryKey => {
  return [TRADING_API_CACHE_KEY, uniswapUrls.tradingApiPaths.swappableTokens, params?.tokenIn, params?.tokenInChainId]
}

const swappableTokensQueryFn = (
  params: SwappableTokensParams,
): QueryFunction<GetSwappableTokensResponse, QueryKey, never> | undefined => {
  return async (): ReturnType<typeof fetchSwappableTokens> => await fetchSwappableTokens(params)
}
