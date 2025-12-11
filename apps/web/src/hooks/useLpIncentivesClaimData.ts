import { UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  ClaimLPRewardsRequest,
  ClaimLPRewardsResponse,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_pb'
import { LIQUIDITY_PATHS, TradingApi, UseQueryApiHelperHookArgs } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { LiquidityServiceClient } from 'uniswap/src/data/apiClients/liquidityService/LiquidityServiceClient'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

type LpIncentivesClaimDataParams = {
  isClaimRewardsLiquidityApiEnabled: boolean
  params: ClaimLPRewardsRequest | TradingApi.ClaimLPRewardsRequest | undefined
}

// Fetch LP incentive claim data from trading API
// The response is transaction data the user can submit to claim their rewards
export function useLpIncentivesClaimData({
  isClaimRewardsLiquidityApiEnabled,
  params,
}: LpIncentivesClaimDataParams): UseQueryResult<ClaimLPRewardsResponse | TradingApi.ClaimLPRewardsResponse> {
  const legacyResult = useLegacyLpIncentivesClaimData({
    params: params as TradingApi.ClaimLPRewardsRequest,
    enabled: !isClaimRewardsLiquidityApiEnabled,
  })
  const liquidityApiResult = useLiquidityApiLpIncentivesClaimData({
    params: params as ClaimLPRewardsRequest,
    enabled: isClaimRewardsLiquidityApiEnabled,
  })

  return isClaimRewardsLiquidityApiEnabled ? liquidityApiResult : legacyResult
}

function useLegacyLpIncentivesClaimData({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  TradingApi.ClaimLPRewardsRequest,
  TradingApi.ClaimLPRewardsResponse
>): UseQueryResult<TradingApi.ClaimLPRewardsResponse> {
  const queryKey = [ReactQueryCacheKey.TradingApi, uniswapUrls.tradingApiPaths.claimRewards, params]

  return useQuery<TradingApi.ClaimLPRewardsResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await TradingApiClient.fetchClaimLpIncentiveRewards(params)
    },
    ...rest,
  })
}

function useLiquidityApiLpIncentivesClaimData({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<ClaimLPRewardsRequest, ClaimLPRewardsResponse>): UseQueryResult<ClaimLPRewardsResponse> {
  const queryKey = [
    ReactQueryCacheKey.LiquidityService,
    uniswapUrls.liquidityServiceUrl,
    LIQUIDITY_PATHS.claimRewards,
    params,
  ]

  return useQuery<ClaimLPRewardsResponse>({
    queryKey,
    queryFn: async () => {
      if (!params) {
        throw { name: 'Params are required' }
      }
      return await LiquidityServiceClient.claimRewards(params)
    },
    ...rest,
  })
}
