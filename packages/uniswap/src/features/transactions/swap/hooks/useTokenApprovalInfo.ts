import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useCheckApprovalQuery } from 'uniswap/src/data/apiClients/tradingApi/useCheckApprovalQuery'
import { ApprovalRequest, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { useActiveGasStrategy, useShadowGasStrategies } from 'uniswap/src/features/gas/hooks'
import { areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { ApprovalAction, TokenApprovalInfo } from 'uniswap/src/features/transactions/swap/types/trade'
import {
  getTokenAddressForApi,
  toTradingApiSupportedChainId,
} from 'uniswap/src/features/transactions/swap/utils/tradingApi'
import { GasFeeEstimates } from 'uniswap/src/features/transactions/types/transactionDetails'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { WalletChainId } from 'uniswap/src/types/chains'
import { logger } from 'utilities/src/logger/logger'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

interface TokenApprovalInfoParams {
  chainId: WalletChainId
  wrapType: WrapType
  currencyInAmount: Maybe<CurrencyAmount<Currency>>
  currencyOutAmount?: Maybe<CurrencyAmount<Currency>>
  routing: Routing | undefined
  account?: AccountMeta
  skip?: boolean
}

export function useTokenApprovalInfo(
  params: TokenApprovalInfoParams,
): (TokenApprovalInfo & { gasEstimates?: GasFeeEstimates; cancelGasFee?: string }) | undefined {
  const { account, chainId, wrapType, currencyInAmount, currencyOutAmount, routing, skip } = params

  const isWrap = wrapType !== WrapType.NotApplicable

  const address = account?.address
  // Off-chain orders must have wrapped currencies approved, rather than natives.
  const currencyIn = routing === Routing.DUTCH_V2 ? currencyInAmount?.currency.wrapped : currencyInAmount?.currency
  const amount = currencyInAmount?.quotient.toString()

  const tokenInAddress = getTokenAddressForApi(currencyIn)

  // Only used for bridging
  const isBridge = routing === Routing.BRIDGE
  const currencyOut = currencyOutAmount?.currency
  const tokenOutAddress = getTokenAddressForApi(currencyOut)

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
    }
  }, [address, amount, chainId, currencyIn, currencyOut?.chainId, isBridge, tokenInAddress, tokenOutAddress])

  const shouldSkip = skip || !approvalRequestArgs || isWrap || !address
  const activeGasStrategy = useActiveGasStrategy(chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(chainId, 'general')

  const { data, error } = useCheckApprovalQuery({
    params: shouldSkip
      ? undefined
      : { ...approvalRequestArgs, gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])] },
    staleTime: 15 * ONE_SECOND_MS,
    immediateGcTime: ONE_MINUTE_MS,
  })

  return useMemo(() => {
    if (error) {
      logger.error(error, {
        tags: { file: 'useTokenApprovalInfo', function: 'useTokenApprovalInfo' },
        extra: {
          approvalRequestArgs,
        },
      })
    }

    if (isWrap) {
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
      if (data.approval && data.cancel) {
        return {
          action: ApprovalAction.RevokeAndPermit2Approve,
          txRequest: data.approval,
          gasFee: data.gasFee,
          cancelTxRequest: data.cancel,
          cancelGasFee: data.cancelGasFee,
        }
      }
      if (data.approval) {
        const activeEstimate = data.gasEstimates?.find((e) => areEqualGasStrategies(e.strategy, activeGasStrategy))

        let gasEstimates: GasFeeEstimates | undefined
        if (activeEstimate) {
          gasEstimates = {
            activeEstimate,
            shadowEstimates: data.gasEstimates?.filter((e) => e !== activeEstimate),
          }
        }

        return {
          action: ApprovalAction.Permit2Approve,
          txRequest: data.approval,
          gasEstimates,
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
  }, [activeGasStrategy, approvalRequestArgs, data, error, isWrap])
}
