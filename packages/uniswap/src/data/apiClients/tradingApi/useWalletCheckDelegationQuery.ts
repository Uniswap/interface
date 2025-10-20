import { type QueryFunction, type QueryKey, skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { type TradingApi, type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type WalletCheckDelegationParams = {
  walletAddresses: TradingApi.WalletCheckDelegationRequestBody['walletAddresses']
  chainIds: TradingApi.WalletCheckDelegationRequestBody['chainIds']
}

export function useWalletCheckDelegationQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  WalletCheckDelegationParams,
  TradingApi.WalletCheckDelegationResponseBody
>): UseQueryResult<TradingApi.WalletCheckDelegationResponseBody> {
  const queryKey = walletCheckDelegationQueryKey(params)

  return useQuery<TradingApi.WalletCheckDelegationResponseBody>({
    queryKey,
    queryFn: params ? walletCheckDelegationQueryFn(params) : skipToken,
    ...rest,
  })
}

const walletCheckDelegationQueryKey = (params?: WalletCheckDelegationParams): QueryKey => {
  return [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.wallet.checkDelegation, params]
}

const walletCheckDelegationQueryFn = (
  params: WalletCheckDelegationParams,
): QueryFunction<TradingApi.WalletCheckDelegationResponseBody, QueryKey, never> | undefined => {
  return async (): ReturnType<typeof checkWalletDelegation> => await checkWalletDelegation(params)
}
