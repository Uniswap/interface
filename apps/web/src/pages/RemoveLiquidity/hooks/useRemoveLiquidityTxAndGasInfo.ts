import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { TradingApi } from '@universe/api'
import { getTokenOrZeroAddress } from 'components/Liquidity/utils/currency'
import { getProtocolItems } from 'components/Liquidity/utils/protocolVersion'
import JSBI from 'jsbi'
import { useRemoveLiquidityModalContext } from 'pages/RemoveLiquidity/RemoveLiquidityModalContext'
import type { RemoveLiquidityTxInfo } from 'pages/RemoveLiquidity/RemoveLiquidityTxContext'
import { useEffect, useMemo, useState } from 'react'
import { useCheckLpApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckLpApprovalQuery'
import { useDecreaseLpPositionCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useDecreaseLpPositionCalldataQuery'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export function useRemoveLiquidityTxAndGasInfo({ account }: { account?: string }): RemoveLiquidityTxInfo {
  const { positionInfo, percent, percentInvalid, currencies, currentTransactionStep } = useRemoveLiquidityModalContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
  }))

  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const currency0 = currencies?.TOKEN0
  const currency1 = currencies?.TOKEN1

  const v2LpTokenApprovalQueryParams: TradingApi.CheckApprovalLPRequest | undefined = useMemo(() => {
    if (!positionInfo || !positionInfo.liquidityToken || percentInvalid || !positionInfo.liquidityAmount) {
      return undefined
    }
    return {
      protocol: TradingApi.ProtocolItems.V2,
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
    enabled: Boolean(v2LpTokenApprovalQueryParams),
  })

  if (approvalError) {
    logger.info(
      'RemoveLiquidityTxAndGasInfo',
      'RemoveLiquidityTxAndGasInfo',
      parseErrorMessageTitle(approvalError, { defaultTitle: 'unkown CheckLpApprovalQuery' }),
      {
        error: JSON.stringify(approvalError),
        v2LpTokenApprovalQueryParams: JSON.stringify(v2LpTokenApprovalQueryParams),
      },
    )
  }

  const v2ApprovalGasFeeUSD =
    useUSDCurrencyAmountOfGasFee(
      positionInfo?.liquidityToken?.chainId,
      v2LpTokenApproval?.gasFeePositionTokenApproval,
    ) ?? undefined

  const approvalsNeeded = Boolean(v2LpTokenApproval)

  const { token0UncollectedFees, token1UncollectedFees } = positionInfo ?? {}

  const decreaseCalldataQueryParams = useMemo((): TradingApi.DecreaseLPPositionRequest | undefined => {
    const apiProtocolItems = getProtocolItems(positionInfo?.version)
    if (!positionInfo || !apiProtocolItems || !account || percentInvalid || !currency0 || !currency1) {
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
      positionLiquidity:
        positionInfo.version === ProtocolVersion.V2
          ? positionInfo.liquidityAmount?.quotient.toString()
          : positionInfo.liquidity,
      expectedTokenOwed0RawAmount: positionInfo.version !== ProtocolVersion.V4 ? token0UncollectedFees : undefined,
      expectedTokenOwed1RawAmount: positionInfo.version !== ProtocolVersion.V4 ? token1UncollectedFees : undefined,
      position: {
        tickLower: positionInfo.tickLower !== undefined ? positionInfo.tickLower : undefined,
        tickUpper: positionInfo.tickUpper !== undefined ? positionInfo.tickUpper : undefined,
        pool: {
          token0: getTokenOrZeroAddress(currency0),
          token1: getTokenOrZeroAddress(currency1),
          fee: positionInfo.feeTier?.feeAmount,
          tickSpacing: positionInfo.tickSpacing ? Number(positionInfo.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
      },
      slippageTolerance: customSlippageTolerance,
    }
  }, [
    positionInfo,
    account,
    percentInvalid,
    currency0,
    currency1,
    approvalsNeeded,
    percent,
    token0UncollectedFees,
    token1UncollectedFees,
    customSlippageTolerance,
  ])

  const isUserCommittedToDecrease =
    currentTransactionStep?.step.type === TransactionStepType.DecreasePositionTransaction

  const {
    data: decreaseCalldata,
    isLoading: decreaseCalldataLoading,
    error: calldataError,
    refetch: calldataRefetch,
  } = useDecreaseLpPositionCalldataQuery({
    params: decreaseCalldataQueryParams,
    deadlineInMinutes: customDeadline,
    refetchInterval: transactionError ? false : 5 * ONE_SECOND_MS,
    retry: false,
    enabled:
      !isUserCommittedToDecrease &&
      !!decreaseCalldataQueryParams &&
      ((!percentInvalid && !v2LpTokenApprovalQueryParams) ||
        (!v2ApprovalLoading && !approvalError && Boolean(v2LpTokenApproval))),
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: +decreaseCalldataQueryParams
  useEffect(() => {
    setTransactionError(getErrorMessageToDisplay({ approvalError, calldataError }))
  }, [calldataError, decreaseCalldataQueryParams, approvalError])

  if (calldataError) {
    const message = parseErrorMessageTitle(calldataError, { defaultTitle: 'DecreaseLpPositionCalldataQuery' })
    logger.error(message, {
      tags: {
        file: 'RemoveLiquidityTxAndGasInfo',
        function: 'useEffect',
      },
    })
    sendAnalyticsEvent(InterfaceEventName.DecreaseLiquidityFailed, {
      message,
    })
  }

  const { value: estimatedGasFee } = useTransactionGasFee({
    tx: decreaseCalldata?.decrease,
    skip: !!decreaseCalldata?.gasFee,
  })
  const decreaseGasFeeUsd =
    useUSDCurrencyAmountOfGasFee(
      toSupportedChainId(decreaseCalldata?.decrease?.chainId) ?? undefined,
      decreaseCalldata?.gasFee || estimatedGasFee,
    ) ?? undefined

  const totalGasFeeEstimate = v2ApprovalGasFeeUSD ? decreaseGasFeeUsd?.add(v2ApprovalGasFeeUSD) : decreaseGasFeeUsd

  return {
    gasFeeEstimateUSD: totalGasFeeEstimate,
    decreaseCalldataLoading,
    decreaseCalldata,
    v2LpTokenApproval,
    approvalLoading: v2ApprovalLoading,
    error: getErrorMessageToDisplay({ approvalError, calldataError }),
    refetch: approvalError ? approvalRefetch : calldataError ? calldataRefetch : undefined,
  }
}
