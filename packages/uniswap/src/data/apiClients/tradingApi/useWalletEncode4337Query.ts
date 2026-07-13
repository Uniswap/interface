import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { TradingApi, V1_TRADING_API_PATHS, type UseQueryApiHelperHookArgs } from '@universe/api'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { GasSponsorshipNotAppliedError } from 'uniswap/src/features/transactions/swap/errors'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useWalletEncode4337Query({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  TradingApi.Encode4337Request,
  TradingApi.Encode4337Response
>): UseQueryResult<TradingApi.Encode4337Response> {
  const queryKey = [ReactQueryCacheKey.TradingApi, V1_TRADING_API_PATHS.wallet.encode4337, params]

  return useQuery<TradingApi.Encode4337Response>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof TradingApiClient.fetchWalletEncoding4337> => {
          const response = await TradingApiClient.fetchWalletEncoding4337(params)

          if (params.paymasterUrl && !response.gasSponsored) {
            throw new GasSponsorshipNotAppliedError(response.gasSponsorshipRejectionReason)
          }

          return response
        }
      : skipToken,
    ...rest,
  })
}
