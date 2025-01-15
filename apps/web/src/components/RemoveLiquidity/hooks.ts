// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { getProtocolItems } from 'components/Liquidity/utils'
import { useRemoveLiquidityModalContext } from 'components/RemoveLiquidity/RemoveLiquidityModalContext'
import { RemoveLiquidityTxInfo } from 'components/RemoveLiquidity/RemoveLiquidityTxContext'
import { ZERO_ADDRESS } from 'constants/misc'
import JSBI from 'jsbi'
import { useCurrencyInfoWithUnwrapForTradingApi } from 'pages/Pool/Positions/create/utils'
import { useMemo } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useDecreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useDecreaseLpPositionCalldataQuery'
import {
  CheckApprovalLPRequest,
  DecreaseLPPositionRequest,
  ProtocolItems,
} from 'uniswap/src/data/tradingApi/__generated__'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useRemoveLiquidityTxAndGasInfo({ account }: { account?: string }): RemoveLiquidityTxInfo {
  const { positionInfo, percent, percentInvalid, unwrapNativeCurrency } = useRemoveLiquidityModalContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsContext()

  const currency0Info = useCurrencyInfoWithUnwrapForTradingApi({
    currency: positionInfo?.currency0Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })
  const currency1Info = useCurrencyInfoWithUnwrapForTradingApi({
    currency: positionInfo?.currency1Amount.currency,
    shouldUnwrap: unwrapNativeCurrency,
  })

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
  const {
    data: v2LpTokenApproval,
    isLoading: v2ApprovalLoading,
    error: approvalError,
    refetch: approvalRefetch,
  } = useCheckLpApprovalQuery({
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
    if (!positionInfo || !apiProtocolItems || !account || percentInvalid || !currency0Info || !currency1Info) {
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
          token0: currency0Info.currency.isNative ? ZERO_ADDRESS : currency0Info.currency.address,
          token1: currency1Info.currency.isNative ? ZERO_ADDRESS : currency1Info.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
      slippageTolerance: customSlippageTolerance,
    }
  }, [
    positionInfo,
    account,
    percentInvalid,
    currency0Info,
    currency1Info,
    approvalsNeeded,
    percent,
    pool?.liquidity,
    pool?.tickCurrent,
    pool?.sqrtRatioX96,
    feeValue0?.quotient,
    feeValue1?.quotient,
    customSlippageTolerance,
  ])

  const {
    data: decreaseCalldata,
    isLoading: decreaseCalldataLoading,
    error: calldataError,
    refetch: calldataRefetch,
  } = useDecreaseLpPositionCalldataQuery({
    params: decreaseCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: 5 * ONE_SECOND_MS,
    enabled:
      (!percentInvalid && !v2LpTokenApprovalQueryParams) ||
      (!v2ApprovalLoading && !approvalError && Boolean(v2LpTokenApproval)),
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
    error: Boolean(approvalError || calldataError),
    refetch: approvalError ? approvalRefetch : calldataError ? calldataRefetch : undefined,
  }
}
