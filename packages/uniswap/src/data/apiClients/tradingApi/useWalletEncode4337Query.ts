import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { TradingApi, type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useWalletEncode4337Query({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  TradingApi.Encode4337Request,
  TradingApi.Encode4337Response
>): UseQueryResult<TradingApi.Encode4337Response> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.wallet.encode4337, params]

  return useQuery<TradingApi.Encode4337Response>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof TradingApiClient.fetchWalletEncoding4337> =>
          await TradingApiClient.fetchWalletEncoding4337(params)
      : skipToken,
    ...rest,
  })
}
