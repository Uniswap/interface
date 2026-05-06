import { useQuery } from '@tanstack/react-query'
import { IncreasePositionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPToken } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { useMemo } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import {
  computePreEstimateIndependentAmount,
  poolHasNativeOrWrappedNativeSide,
  useIsLiquidityGasPreEstimationEnabled,
} from '~/features/Liquidity/hooks/preEstimatedLiquidityGasUtils'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'
import { LiquidityModalInitialState } from '~/state/application/reducer'

export function usePreEstimatedIncreaseLiquidityGas({
  positionInfo,
  accountAddress,
}: {
  positionInfo: LiquidityModalInitialState | undefined
  accountAddress: string | undefined
}): {
  gasFee: string | undefined
  isLoading: boolean
} {
  const chainId = positionInfo?.currency0Amount.currency.chainId
  const isEnabled = useIsLiquidityGasPreEstimationEnabled(chainId)

  const token0 = positionInfo?.currency0Amount.currency
  const token1 = positionInfo?.currency1Amount.currency

  const hasNativeOrWrappedNativeSide = poolHasNativeOrWrappedNativeSide({ token0, token1, chainId })

  const preEstimateResult = useMemo(() => {
    if (!positionInfo?.poolOrPair || !token0 || !token1 || chainId == null) {
      return undefined
    }
    return computePreEstimateIndependentAmount({
      poolOrPair: positionInfo.poolOrPair,
      tickLower: positionInfo.tickLower,
      tickUpper: positionInfo.tickUpper,
      token0,
      token1,
    })
  }, [positionInfo, token0, token1, chainId])

  const { amountRaw: independentAmountRaw, independentCurrency } = preEstimateResult ?? {}

  const preEstimateRequest =
    isEnabled &&
    hasNativeOrWrappedNativeSide &&
    positionInfo &&
    accountAddress &&
    token0 &&
    token1 &&
    chainId != null &&
    independentCurrency &&
    independentAmountRaw
      ? new IncreasePositionRequest({
          walletAddress: accountAddress,
          chainId,
          protocol: getProtocols(positionInfo.version),
          token0Address: getTokenOrZeroAddress(token0),
          token1Address: getTokenOrZeroAddress(token1),
          nftTokenId: positionInfo.tokenId,
          independentToken: new LPToken({
            tokenAddress: getTokenOrZeroAddress(independentCurrency),
            amount: independentAmountRaw,
          }),
          simulateTransaction: true,
          includeApprovalSimulation: true,
        })
      : undefined

  const { data, isLoading } = useQuery(
    liquidityQueries.increasePosition({
      params: preEstimateRequest,
      staleTime: Infinity,
      retry: false,
      enabled: Boolean(preEstimateRequest),
    }),
  )

  return {
    gasFee: data?.gasFee,
    isLoading,
  }
}
