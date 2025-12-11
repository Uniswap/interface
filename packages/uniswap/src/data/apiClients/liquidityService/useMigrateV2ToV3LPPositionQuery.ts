import { UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { LIQUIDITY_PATHS, type UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useMigrateV2ToV3LPPositionQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  MigrateV2ToV3LPPositionRequest,
  MigrateV2ToV3LPPositionResponse
>): UseQueryResult<MigrateV2ToV3LPPositionResponse> {
  const queryKey = [
    ReactQueryCacheKey.LiquidityService,
    uniswapUrls.liquidityServiceUrl,
    LIQUIDITY_PATHS.migrateV2ToV3LPPosition,
    params,
  ]

  return useQuery<MigrateV2ToV3LPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await LiquidityServiceClient.migrateV2ToV3LpPosition(params)
    },
    ...rest,
  })
}
