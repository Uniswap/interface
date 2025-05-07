import { TransactionRequest } from '@ethersproject/providers'
import { UseQueryResult, skipToken } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useQueryWithImmediateGarbageCollection } from 'uniswap/src/data/apiClients/hooks/useQueryWithImmediateGarbageCollection'
import { UseQueryWithImmediateGarbageCollectionApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { GasFeeResultWithoutState, createFetchGasFee } from 'uniswap/src/data/apiClients/uniswapApi/UniswapApiClient'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useGasFeeQuery({
  params,
  ...rest
}: UseQueryWithImmediateGarbageCollectionApiHelperHookArgs<
  { tx: TransactionRequest; fallbackGasLimit?: number },
  GasFeeResultWithoutState
>): UseQueryResult<GasFeeResultWithoutState> {
  const activeGasStrategy = useActiveGasStrategy(params?.tx.chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(params?.tx.chainId, 'general')

  const fetchGasFee = useEvent(createFetchGasFee({ activeGasStrategy, shadowGasStrategies }))

  const queryKey = [ReactQueryCacheKey.UniswapApi, uniswapUrls.gasServicePath, params]

  return useQueryWithImmediateGarbageCollection<GasFeeResultWithoutState>({
    queryKey,
    queryFn: params ? (): Promise<GasFeeResultWithoutState> => fetchGasFee(params) : skipToken,
    ...rest,
  })
}
