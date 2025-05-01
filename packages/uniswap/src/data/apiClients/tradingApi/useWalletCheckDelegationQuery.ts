import { QueryFunction, QueryKey, UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import {
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody,
} from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export type WalletCheckDelegationParams = {
  walletAddress: WalletCheckDelegationRequestBody['walletAddress']
  chainIds: WalletCheckDelegationRequestBody['chainIds']
}

export function useWalletCheckDelegationQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  WalletCheckDelegationRequestBody,
  WalletCheckDelegationResponseBody
>): UseQueryResult<WalletCheckDelegationResponseBody> {
  const queryKey = walletCheckDelegationQueryKey(params)

  return useQuery<WalletCheckDelegationResponseBody>({
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
): QueryFunction<WalletCheckDelegationResponseBody, QueryKey, never> | undefined => {
  return async (): ReturnType<typeof checkWalletDelegation> => await checkWalletDelegation(params)
}
