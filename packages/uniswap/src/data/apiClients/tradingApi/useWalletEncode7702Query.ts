import { QueryFunction, QueryKey, UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { fetchWalletEncoding7702 } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { Encode7702ResponseBody, WalletEncode7702RequestBody } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type WalletEncode7702Params = {
  calls: WalletEncode7702RequestBody['calls']
  smartContractDelegationAddress: WalletEncode7702RequestBody['smartContractDelegationAddress']
}

// TODO: remove this once the API is updated
// https://linear.app/uniswap/issue/API-1050/add-missing-walletaddress-field-to-api-endpoint-types-json
export type Encode7702RequestBodyWithWalletAddress = WalletEncode7702RequestBody & {
  walletAddress: string
}

export function useWalletEncode7702Query({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  Encode7702RequestBodyWithWalletAddress,
  Encode7702ResponseBody
>): UseQueryResult<Encode7702ResponseBody> {
  const queryKey = walletEncode7702QueryKey(params)

  return useQuery<Encode7702ResponseBody>({
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
): QueryFunction<Encode7702ResponseBody, QueryKey, never> | undefined => {
  return async (): ReturnType<typeof fetchWalletEncoding7702> => await fetchWalletEncoding7702(params)
}
