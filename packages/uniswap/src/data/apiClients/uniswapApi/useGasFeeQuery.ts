import { TransactionRequest } from '@ethersproject/providers'
import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { UNISWAP_API_CACHE_KEY, fetchGasFee } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { GasStrategy } from 'uniswap/src/data/tradingApi/types'
import { GasFeeResponse } from 'uniswap/src/features/gas/types'

export function useGasFeeQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  TransactionRequest & { gasStrategies: GasStrategy[] },
  GasFeeResponse
>): UseQueryResult<GasFeeResponse> {
  const queryKey = [UNISWAP_API_CACHE_KEY, uniswapUrls.gasServicePath, params]

  return useQueryWithImmediateGarbageCollection<GasFeeResponse>({
    queryKey,
    queryFn: params ? async (): ReturnType<typeof fetchGasFee> => await fetchGasFee(params) : skipToken,
    ...rest,
  })
}
