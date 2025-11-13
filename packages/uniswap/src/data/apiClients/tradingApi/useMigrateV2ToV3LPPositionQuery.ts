import { UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
} from '@uniswap/client-trading/dist/trading/v1/api_pb'
import type { UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useMigrateV2ToV3LPPositionQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse
>): UseQueryResult<MigrateV2ToV3LPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.migrate, params]

  return useQuery<MigrateV2ToV3LPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await TradingApiClient.migrateV2ToV3LpPosition(params)
    },
    ...rest,
  })
}
