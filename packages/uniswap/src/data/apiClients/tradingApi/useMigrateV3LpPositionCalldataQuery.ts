import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { migrateLpPosition } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { MigrateLPPositionRequest, MigrateLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export function useMigrateV3LpPositionCalldataQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  MigrateLPPositionRequest,
  MigrateLPPositionResponse
>): UseQueryResult<MigrateLPPositionResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.migrate, params]

  return useQuery<MigrateLPPositionResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await migrateLpPosition(params)
    },
    ...rest,
  })
}
