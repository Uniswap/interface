import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { ApprovalRequest, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  convertGasFeeToDisplayValue,
  useActiveGasStrategy,
  useShadowGasStrategies,
} from 'uniswap/src/features/gas/hooks'
import { GasFeeResult, areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export interface TokenApprovalInfoParams {
  chainId: UniverseChainId
  wrapType: WrapType
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  currencyOutAmount?: Maybe<CurrencyAmount<Currency>>
  routing: Routing | undefined
  account?: AccountMeta
}

export type ApprovalTxInfo = {
  tokenApprovalInfo: TokenApprovalInfo
  approvalGasFeeResult: GasFeeResult
  revokeGasFeeResult: GasFeeResult
}
export function useTokenApprovalInfo(params: TokenApprovalInfoParams): ApprovalTxInfo {
  const { account, chainId, wrapType, currencyInAmount, currencyOutAmount, routing } = params

  const isWrap = wrapType !== WrapType.NotApplicable

  const address = account?.address
  const inputWillBeWrapped = routing && isUniswapX({ routing })
  // Off-chain orders must have wrapped currencies approved, rather than natives.
  const currencyIn = inputWillBeWrapped ? currencyInAmount?.currency.wrapped : currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenInAddress = getTokenAddressForApi(currencyIn)

  // Only used for bridging
  const isBridge = routing === Routing.BRIDGE
  const currencyOut = currencyOutAmount?.currency
  const tokenOutAddress = getTokenAddressForApi(currencyOut)

  const activeGasStrategy = useActiveGasStrategy(chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(chainId, 'general')

  const approvalRequestArgs: ApprovalRequest | undefined = useMemo(() => {
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
      gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])],
    }
  }, [
    activeGasStrategy,
    address,
    amount,
    chainId,
    currencyIn,
    currencyOut?.chainId,
    isBridge,
    tokenInAddress,
    tokenOutAddress,
    shadowGasStrategies,
  ])

  const shouldSkip = !approvalRequestArgs || isWrap || !address

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
    if (isWrap || !address) {
      return {
        action: ApprovalAction.None,
        txRequest: null,
        cancelTxRequest: null,
      }
    }

    if (data && !error) {
      // API returns null if no approval is required
      if (data.approval === null) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
          cancelTxRequest: null,
        }
      }

      if (data.approval) {
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
  }, [address, approvalRequestArgs, data, error, isWrap])

  return useMemo(() => {
    const activeEstimate = data?.gasEstimates?.find((e) => areEqualGasStrategies(e.strategy, activeGasStrategy))

    const noApprovalNeeded = tokenApprovalInfo.action === ApprovalAction.None
    const noRevokeNeeded =
      tokenApprovalInfo.action === ApprovalAction.Permit2Approve || tokenApprovalInfo.action === ApprovalAction.None
    const approvalFee = noApprovalNeeded ? '0' : data?.gasFee
    const revokeFee = noRevokeNeeded ? '0' : data?.cancelGasFee

    const unknownApproval = tokenApprovalInfo.action === ApprovalAction.Unknown
    const isGasLoading = unknownApproval && isLoading
    const approvalGasError = unknownApproval && !isLoading ? new Error('Approval action unknown') : null

    let gasEstimates: GasFeeEstimates | undefined
    if (activeEstimate) {
      gasEstimates = {
        activeEstimate,
        shadowEstimates: data?.gasEstimates?.filter((e) => e !== activeEstimate),
      }
    }

    return {
      tokenApprovalInfo,
      approvalGasFeeResult: {
        value: approvalFee,
        displayValue: convertGasFeeToDisplayValue(approvalFee, activeGasStrategy),
        isLoading: isGasLoading,
        error: approvalGasError,
        gasEstimates,
        activeEstimate,
      },
      revokeGasFeeResult: {
        value: revokeFee,
        displayValue: convertGasFeeToDisplayValue(revokeFee, activeGasStrategy),
        isLoading: isGasLoading,
        error: approvalGasError,
      },
    }
  }, [activeGasStrategy, data?.cancelGasFee, data?.gasEstimates, data?.gasFee, isLoading, tokenApprovalInfo])
}
