import { type QueryFunction, type QueryKey, skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { V1_TRADING_API_PATHS, type TradingApi, type UseQueryApiHelperHookArgs } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useWalletEncode7702Query({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  TradingApi.WalletEncode7702RequestBody,
  TradingApi.Encode7702ResponseBody
>): UseQueryResult<TradingApi.Encode7702ResponseBody> {
  const queryKey = walletEncode7702QueryKey(params)

  return useQuery<TradingApi.Encode7702ResponseBody>({
    queryKey,
    queryFn: params ? walletEncode7702QueryFn(params) : skipToken,
    ...rest,
  })
}

const walletEncode7702QueryKey = (params?: TradingApi.WalletEncode7702RequestBody): QueryKey => {
  return [ReactQueryCacheKey.TradingApi, V1_TRADING_API_PATHS.wallet.encode7702, params]
}

const walletEncode7702QueryFn = (
  params: TradingApi.WalletEncode7702RequestBody,
): QueryFunction<TradingApi.Encode7702ResponseBody, QueryKey, never> | undefined => {
  return async (): ReturnType<typeof TradingApiClient.fetchWalletEncoding7702> =>
    await TradingApiClient.fetchWalletEncoding7702(params)
}
