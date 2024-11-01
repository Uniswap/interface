// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { getProtocolItems } from 'components/Liquidity/utils'
import { useLiquidityModalContext } from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityTxInfo } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { ZERO_ADDRESS } from 'constants/misc'
import JSBI from 'jsbi'
import { useMemo } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useDecreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useDecreaseLpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  DecreaseLPPositionRequest,
  ProtocolItems,
} from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useRemoveLiquidityTxAndGasInfo({ account }: { account?: string }): RemoveLiquidityTxInfo {
  const { positionInfo, percent, percentInvalid } = useLiquidityModalContext()

  const pool =
    positionInfo?.version === ProtocolVersion.V3 || positionInfo?.version === ProtocolVersion.V4
      ? positionInfo.pool
      : undefined

  const v2LpTokenApprovalQueryParams: CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !positionInfo.liquidityToken || percentInvalid || !positionInfo.liquidityAmount) {
      return undefined
    }
    return {
      protocol: ProtocolItems.V2,
      walletAddress: account,
      chainId: positionInfo.liquidityToken.chainId,
      positionToken: positionInfo.liquidityToken.address,
      positionAmount: positionInfo.liquidityAmount
        .multiply(JSBI.BigInt(percent))
        .divide(JSBI.BigInt(100))
        .quotient.toString(),
    }
  }, [positionInfo, percent, account, percentInvalid])
  const { data: v2LpTokenApproval, isLoading: v2ApprovalLoading } = useCheckLpApprovalQuery({
    params: v2LpTokenApprovalQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })
  const v2ApprovalGasFeeUSD =
    useUSDCurrencyAmountOfGasFee(
      positionInfo?.liquidityToken?.chainId,
      v2LpTokenApproval?.gasFeePositionTokenApproval,
    ) ?? undefined

  const approvalsNeeded = Boolean(v2LpTokenApproval)

  const { feeValue0, feeValue1 } = useV3OrV4PositionDerivedInfo(positionInfo)

  const decreaseCalldataQueryParams = useMemo((): DecreaseLPPositionRequest | undefined => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    if (!positionInfo || !apiProtocolItems || !account || percentInvalid) {
      return undefined
    }
    return {
      simulateTransaction: !approvalsNeeded,
      protocol: apiProtocolItems,
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      chainId: positionInfo.currency0Amount.currency.chainId,
      walletAddress: account,
      liquidityPercentageToDecrease: Number(percent),
      liquidity0:
        positionInfo.version === ProtocolVersion.V2 ? positionInfo.currency0Amount.quotient.toString() : undefined,
      liquidity1:
        positionInfo.version === ProtocolVersion.V2 ? positionInfo.currency1Amount.quotient.toString() : undefined,
      poolLiquidity: pool?.liquidity.toString(),
      currentTick: pool?.tickCurrent,
      sqrtRatioX96: pool?.sqrtRatioX96.toString(),
      positionLiquidity:
        positionInfo.version === ProtocolVersion.V2
          ? positionInfo.liquidityAmount?.quotient.toString()
          : positionInfo.liquidity,
      expectedTokenOwed0RawAmount:
        positionInfo.version !== ProtocolVersion.V4 ? feeValue0?.quotient.toString() : undefined,
      expectedTokenOwed1RawAmount:
        positionInfo.version !== ProtocolVersion.V4 ? feeValue1?.quotient.toString() : undefined,
      position: {
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
    }
  }, [account, positionInfo, percentInvalid, percent, pool, approvalsNeeded, feeValue0, feeValue1])

  const { data: decreaseCalldata, isLoading: decreaseCalldataLoading } = useDecreaseLpPositionCalldataQuery({
    params: decreaseCalldataQueryParams,
    staleTime: 5 * ONE_SECOND_MS,
  })

  const { value: estimatedGasFee } = useTransactionGasFee(decreaseCalldata?.decrease, !!decreaseCalldata?.gasFee)
  const decreaseGasFeeUsd =
    useUSDCurrencyAmountOfGasFee(decreaseCalldata?.decrease?.chainId, decreaseCalldata?.gasFee || estimatedGasFee) ??
    undefined

  const totalGasFeeEstimate = v2ApprovalGasFeeUSD ? decreaseGasFeeUsd?.add(v2ApprovalGasFeeUSD) : decreaseGasFeeUsd

  return {
    gasFeeEstimateUSD: totalGasFeeEstimate,
    decreaseCalldataLoading,
    decreaseCalldata,
    v2LpTokenApproval,
    approvalLoading: v2ApprovalLoading,
  }
}
