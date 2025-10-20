import { type QueryFunction, type QueryKey, skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type TradingApi, type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type WalletEncode7702Params = {
  calls: TradingApi.WalletEncode7702RequestBody['calls']
  smartContractDelegationAddress: TradingApi.WalletEncode7702RequestBody['smartContractDelegationAddress']
}

// TODO: remove this once the API is updated
// https://linear.app/uniswap/issue/API-1050/add-missing-walletaddress-field-to-api-endpoint-types-json
export type Encode7702RequestBodyWithWalletAddress = TradingApi.WalletEncode7702RequestBody & {
  walletAddress: string
}

export function useWalletEncode7702Query({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  Encode7702RequestBodyWithWalletAddress,
  TradingApi.Encode7702ResponseBody
>): UseQueryResult<TradingApi.Encode7702ResponseBody> {
  const queryKey = walletEncode7702QueryKey(params)

  return useQuery<TradingApi.Encode7702ResponseBody>({
    queryKey,
    queryFn: params ? walletEncode7702QueryFn(params) : skipToken,
    ...rest,
  })
}

const walletEncode7702QueryKey = (params?: WalletEncode7702Params): QueryKey => {
  return [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.wallet.encode7702, params]
}

const walletEncode7702QueryFn = (
  params: WalletEncode7702Params,
): QueryFunction<TradingApi.Encode7702ResponseBody, QueryKey, never> | undefined => {
  return async (): ReturnType<typeof TradingApiClient.fetchWalletEncoding7702> =>
    await TradingApiClient.fetchWalletEncoding7702(params)
}
