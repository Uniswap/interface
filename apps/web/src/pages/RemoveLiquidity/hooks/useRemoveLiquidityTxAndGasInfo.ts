import { useQuery } from '@tanstack/react-query'
import { Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { DecreasePositionRequest, LPApprovalRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { LPAction, LPToken } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { useEffect, useMemo, useState } from 'react'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'
import { useCheckLPApprovalQuery } from 'uniswap/src/data/apiClients/liquidityService/useCheckLPApprovalQuery'
import { getTradeSettingsDeadline } from 'uniswap/src/data/apiClients/tradingApi/utils/getTradeSettingsDeadline'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { useTransactionGasFee, useUSDCurrencyAmountOfGasFee } from 'uniswap/src/features/gas/hooks'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { getIsPermissioned } from 'uniswap/src/features/positions/utils'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useLogLiquidityTxError } from 'uniswap/src/features/transactions/liquidity/useLogLiquidityTxError'
import { getErrorMessageToDisplay, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import { getWrappedTokenIfExists } from 'uniswap/src/utils/currency'
import { logger } from 'utilities/src/logger/logger'
import { LP_GAS_URGENCY } from '~/features/Liquidity/constants'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import { getProtocols } from '~/features/Liquidity/utils/protocolVersion'
import {
  REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS,
  useRemoveLiquidityModalContext,
} from '~/pages/RemoveLiquidity/RemoveLiquidityModalContext'
import type { RemoveLiquidityTxInfo } from '~/pages/RemoveLiquidity/RemoveLiquidityTxContext'

function buildCheckApprovalLPRequest({
  positionInfo,
  walletAddress,
}: {
  positionInfo: PositionInfo
  walletAddress: string
}): LPApprovalRequest | undefined {
  const protocol = getProtocols(positionInfo.version)

  if (protocol === undefined) {
    return undefined
  }

  switch (protocol) {
    case Protocols.V2:
      return new LPApprovalRequest({
        walletAddress,
        protocol,
        chainId: positionInfo.liquidityToken?.chainId,
        lpTokens: [
          new LPToken({
            tokenAddress: getWrappedTokenIfExists(positionInfo.currency0Amount.currency)?.address,
            amount: '0', // the amounts here don't matter since the approval is based on the positionToken
          }),
          new LPToken({
            tokenAddress: getWrappedTokenIfExists(positionInfo.currency1Amount.currency)?.address,
            amount: '0',
          }),
        ],
        action: LPAction.DECREASE,
        simulateTransaction: true,
      })
    default:
      return undefined
  }
}

// oxlint-disable-next-line complexity
export function useRemoveLiquidityTxAndGasInfo({ account }: { account?: string }): RemoveLiquidityTxInfo {
  const { positionInfo, percent, percentInvalid, currencies, committedDecrease, unwrapNativeCurrency } =
    useRemoveLiquidityModalContext()
  const { customDeadline, customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customDeadline: s.customDeadline,
    customSlippageTolerance: s.customSlippageTolerance,
  }))

  const [transactionError, setTransactionError] = useState<string | boolean>(false)

  const currency0 = currencies?.TOKEN0
  const currency1 = currencies?.TOKEN1

  const approvalQueryParams = useMemo(() => {
    if (!positionInfo || !account || percentInvalid) {
      return undefined
    }

    return buildCheckApprovalLPRequest({
      positionInfo,
      walletAddress: account,
    })
  }, [positionInfo, account, percentInvalid])

  const {
    approvalData: v2LpTokenApproval,
    approvalLoading: v2ApprovalLoading,
    approvalError,
    approvalRefetch,
  } = useCheckLPApprovalQuery({
    approvalQueryParams,
    isQueryEnabled: Boolean(approvalQueryParams),
    positionTokenAddress: positionInfo?.liquidityToken?.address,
  })

  const approvalErrorMessage = approvalError
    ? parseErrorMessageTitle(approvalError, { defaultTitle: 'unknown CheckLpApprovalQuery' })
    : undefined

  useEffect(() => {
    if (!approvalErrorMessage) {
      return
    }

    logger.info('RemoveLiquidityTxAndGasInfo', 'RemoveLiquidityTxAndGasInfo', approvalErrorMessage, {
      error: JSON.stringify(approvalError),
      v2LpTokenApprovalQueryParams: JSON.stringify(approvalQueryParams),
    })
    // Keyed on the parsed message alone, as in `useLogLiquidityTxError`: the error object and the
    // query params are rebuilt on every render, so depending on them would restore the per-render
    // logging — and both `JSON.stringify` calls — that this replaces.
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- dedupe is keyed on the message only
  }, [approvalErrorMessage])

  const v2ApprovalGasFeeUSD =
    useUSDCurrencyAmountOfGasFee(
      positionInfo?.liquidityToken?.chainId,
      v2LpTokenApproval?.gasFeePositionTokenApproval,
    ) ?? undefined

  const approvalsNeeded = !v2ApprovalLoading && Boolean(v2LpTokenApproval?.positionTokenApproval)

  // `positionInfo` and `currencies` are rebuilt from every GetPosition poll (protobuf responses defeat
  // structural sharing), so build the request from the primitives it carries. Rebuilding on identity
  // would re-stamp a now-based custom `deadline` each poll, re-keying the query and dropping the calldata
  // (and with it the Confirm button) while the refetch is in flight.
  const hasPosition = Boolean(positionInfo)
  const protocol = positionInfo ? getProtocols(positionInfo.version) : undefined
  const nftTokenId = positionInfo?.tokenId
  const permissioned = positionInfo ? getIsPermissioned(positionInfo) : undefined
  const chainId = currency0?.chainId
  const token0Address = getTokenOrZeroAddress(currency0)
  const token1Address = getTokenOrZeroAddress(currency1)

  const decreaseCalldataQueryParams = useMemo((): DecreasePositionRequest | undefined => {
    if (!hasPosition || !account || percentInvalid || chainId === undefined || !token0Address || !token1Address) {
      return undefined
    }

    return new DecreasePositionRequest({
      walletAddress: account,
      chainId,
      protocol,
      token0Address,
      token1Address,
      nftTokenId,
      permissioned,
      liquidityPercentageToDecrease: Number(percent),
      slippageTolerance: customSlippageTolerance,
      deadline: getTradeSettingsDeadline(customDeadline),
      simulateTransaction: !approvalsNeeded,
      withdrawAsWeth: !unwrapNativeCurrency,
    })
  }, [
    hasPosition,
    account,
    percentInvalid,
    chainId,
    protocol,
    token0Address,
    token1Address,
    nftTokenId,
    permissioned,
    percent,
    customSlippageTolerance,
    customDeadline,
    approvalsNeeded,
    unwrapNativeCurrency,
  ])

  // Once the user has committed the saga holds its calldata; a fresher quote could only disagree with it.
  const hasCommitted = committedDecrease !== undefined
  const isQueryEnabled =
    !hasCommitted &&
    ((!percentInvalid && !approvalQueryParams) || (!v2ApprovalLoading && !approvalError && Boolean(v2LpTokenApproval)))

  const {
    data: decreaseCalldata,
    isLoading: decreaseCalldataLoading,
    error: calldataError,
    refetch: calldataRefetch,
  } = useQuery(
    liquidityQueries.decreasePosition({
      params: decreaseCalldataQueryParams,
      refetchInterval: transactionError ? false : REMOVE_LIQUIDITY_REFETCH_INTERVAL_MS,
      retry: false,
      enabled: isQueryEnabled && Boolean(decreaseCalldataQueryParams),
    }),
  )

  useEffect(() => {
    setTransactionError(getErrorMessageToDisplay({ approvalError, calldataError }))
  }, [calldataError, decreaseCalldataQueryParams, approvalError])

  useLogLiquidityTxError({
    error: calldataError,
    defaultTitle: 'DecreaseLpPositionCalldataQuery',
    file: 'RemoveLiquidityTxAndGasInfo',
    functionName: 'liquidityQueries.decreasePosition',
    onError: (message) => {
      sendAnalyticsEvent(InterfaceEventName.DecreaseLiquidityFailed, {
        message,
        // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
        ...decreaseCalldataQueryParams,
      })
    },
  })

  const { displayValue: estimatedGasFee } = useTransactionGasFee({
    tx: decreaseCalldata?.decrease,
    skip: !!decreaseCalldata?.gasFee,
    urgency: LP_GAS_URGENCY,
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
