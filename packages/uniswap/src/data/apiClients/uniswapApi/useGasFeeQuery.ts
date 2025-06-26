import { TransactionRequest } from '@ethersproject/providers'
import { UseQueryResult, keepPreviousData, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { GasFeeResultWithoutState, createFetchGasFee } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { getActiveGasStrategy, getShadowGasStrategies } from 'uniswap/src/features/gas/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useGasFeeQuery({
  params,
  // Warning: only use when it's Ok to return old data even when params change.
  shouldUsePreviousValueDuringLoading,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  { tx: TransactionRequest; fallbackGasLimit?: number },
  GasFeeResultWithoutState
> & { shouldUsePreviousValueDuringLoading?: boolean }): UseQueryResult<GasFeeResultWithoutState> {
  const activeGasStrategy = useActiveGasStrategy(params?.tx.chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(params?.tx.chainId, 'general')

  const fetchGasFee = useEvent(createFetchGasFee({ activeGasStrategy, shadowGasStrategies }))

  const queryKey = [ReactQueryCacheKey.UniswapApi, uniswapUrls.gasServicePath, params]

  return useQueryWithImmediateGarbageCollection<GasFeeResultWithoutState>({
    queryKey,
    queryFn: params ? (): Promise<GasFeeResultWithoutState> => fetchGasFee(params) : skipToken,
    ...(shouldUsePreviousValueDuringLoading && { placeholderData: keepPreviousData }),
    ...rest,
  })
}

export async function fetchGasFeeQuery(params: {
  tx: TransactionRequest
  fallbackGasLimit?: number
  smartContractDelegationAddress?: Address
  isStatsigReady: boolean
}): Promise<GasFeeResultWithoutState> {
  const { tx, smartContractDelegationAddress, isStatsigReady } = params
  const activeGasStrategy = getActiveGasStrategy({ chainId: tx.chainId, type: 'general', isStatsigReady })
  const shadowGasStrategies = getShadowGasStrategies({ chainId: tx.chainId, type: 'general', isStatsigReady })
  const fetchGasFee = createFetchGasFee({ activeGasStrategy, shadowGasStrategies, smartContractDelegationAddress })
  return fetchGasFee(params)
}
