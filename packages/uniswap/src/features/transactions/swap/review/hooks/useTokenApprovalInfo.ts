import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { useMemo } from 'react'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { convertGasFeeToDisplayValue, useActiveGasStrategy } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { AccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export interface TokenApprovalInfoParams {
  chainId: UniverseChainId
  wrapType: WrapType
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  currencyOutAmount?: Maybe<CurrencyAmount<Currency>>
  routing: TradingApi.Routing | undefined
  account?: AccountDetails
}

export type ApprovalTxInfo = {
  tokenApprovalInfo: TokenApprovalInfo
  approvalGasFeeResult: GasFeeResult
  revokeGasFeeResult: GasFeeResult
}

function useApprovalWillBeBatchedWithSwap(chainId: UniverseChainId, routing: TradingApi.Routing | undefined): boolean {
  const canBatchTransactions = useUniswapContextSelector((ctx) => ctx.getCanBatchTransactions?.(chainId))
  const swapDelegationInfo = useUniswapContextSelector((ctx) => ctx.getSwapDelegationInfo?.(chainId))

  const isBatchableFlow = Boolean(routing && !isUniswapX({ routing }))

  return Boolean((canBatchTransactions || swapDelegationInfo?.delegationAddress) && isBatchableFlow)
}

export function useTokenApprovalInfo(params: TokenApprovalInfoParams): ApprovalTxInfo {
  const { account, chainId, wrapType, currencyInAmount, currencyOutAmount, routing } = params

  const isWrap = wrapType !== WrapType.NotApplicable
  /** Approval is included elsewhere for Chained Actions so it can be skipped */
  const isChained = routing === TradingApi.Routing.CHAINED

  const address = account?.address
  const inputWillBeWrapped = routing && isUniswapX({ routing })
  // Off-chain orders must have wrapped currencies approved, rather than natives.
  const currencyIn = inputWillBeWrapped ? currencyInAmount?.currency.wrapped : currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenInAddress = getTokenAddressForApi(currencyIn)

  // Only used for bridging
  const isBridge = routing === TradingApi.Routing.BRIDGE
  const currencyOut = currencyOutAmount?.currency
  const tokenOutAddress = getTokenAddressForApi(currencyOut)

  const gasStrategy = useActiveGasStrategy(chainId, 'general')

  const approvalRequestArgs: TradingApi.ApprovalRequest | undefined = useMemo(() => {
    const tokenInChainId = toTradingApiSupportedChainId(chainId)
    const tokenOutChainId = toTradingApiSupportedChainId(currencyOut?.chainId)

    if (!address || !amount || !currencyIn || !tokenInAddress || !tokenInChainId) {
      return undefined
    }
    if (isBridge && !tokenOutAddress && !tokenOutChainId) {
      return undefined
    }

    return {
      walletAddress: address,
      token: tokenInAddress,
      amount,
      chainId: tokenInChainId,
      includeGasInfo: true,
      tokenOut: tokenOutAddress,
      tokenOutChainId,
      gasStrategies: [gasStrategy],
    }
  }, [
    gasStrategy,
    address,
    amount,
    chainId,
    currencyIn,
    currencyOut?.chainId,
    isBridge,
    tokenInAddress,
    tokenOutAddress,
  ])

  const approvalWillBeBatchedWithSwap = useApprovalWillBeBatchedWithSwap(chainId, routing)
  const shouldSkip = !approvalRequestArgs || isWrap || !address || approvalWillBeBatchedWithSwap || isChained

  const { data, isLoading, error } = useCheckApprovalQuery({
    params: shouldSkip ? undefined : approvalRequestArgs,
    staleTime: 15 * ONE_SECOND_MS,
    immediateGcTime: ONE_MINUTE_MS,
  })

  const tokenApprovalInfo: TokenApprovalInfo = useMemo(() => {
    if (error) {
      logger.error(error, {
        tags: { file: 'useTokenApprovalInfo', function: 'useTokenApprovalInfo' },
        extra: {
          approvalRequestArgs,
        },
      })
    }

    // Approval is N/A for wrap transactions or unconnected state.
    if (isWrap || !address || approvalWillBeBatchedWithSwap || isChained) {
      return {
        action: ApprovalAction.None,
        txRequest: null,
        cancelTxRequest: null,
      }
    }

    if (data && !error) {
      // API returns null if no approval is required

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (data.approval === null) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (data.approval) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (data.cancel) {
          return {
            action: ApprovalAction.RevokeAndPermit2Approve,
            txRequest: data.approval,
            cancelTxRequest: data.cancel,
          }
        }

        return {
          action: ApprovalAction.Permit2Approve,
          txRequest: data.approval,
          cancelTxRequest: null,
        }
      }
    }

    // No valid approval type found
    return {
      action: ApprovalAction.Unknown,
      txRequest: null,
      cancelTxRequest: null,
    }
  }, [address, approvalRequestArgs, approvalWillBeBatchedWithSwap, data, error, isWrap, isChained])

  return useMemo(() => {
    const gasEstimate = data?.gasEstimates?.[0]
    const noApprovalNeeded = tokenApprovalInfo.action === ApprovalAction.None
    const noRevokeNeeded =
      tokenApprovalInfo.action === ApprovalAction.Permit2Approve || tokenApprovalInfo.action === ApprovalAction.None
    const approvalFee = noApprovalNeeded ? '0' : data?.gasFee
    const revokeFee = noRevokeNeeded ? '0' : data?.cancelGasFee

    const unknownApproval = tokenApprovalInfo.action === ApprovalAction.Unknown
    const isGasLoading = unknownApproval && isLoading
    const approvalGasError = unknownApproval && !isLoading ? new Error('Approval action unknown') : null

    return {
      tokenApprovalInfo,
      approvalGasFeeResult: {
        value: approvalFee,
        displayValue: convertGasFeeToDisplayValue(approvalFee, gasStrategy),
        isLoading: isGasLoading,
        error: approvalGasError,
        gasEstimate,
      },
      revokeGasFeeResult: {
        value: revokeFee,
        displayValue: convertGasFeeToDisplayValue(revokeFee, gasStrategy),
        isLoading: isGasLoading,
        error: approvalGasError,
      },
    }
  }, [gasStrategy, data?.cancelGasFee, data?.gasEstimates, data?.gasFee, isLoading, tokenApprovalInfo])
}
