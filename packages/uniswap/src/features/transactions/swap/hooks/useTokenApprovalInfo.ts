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
import { areEqualGasStrategies } from 'uniswap/src/features/gas/types'
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
  skip?: boolean
}

interface TokenApprovalGasInfo {
  gasFee?: string
  displayGasFee?: string
  cancelGasFee?: string
  displayCancelGasFee?: string
  gasEstimates?: GasFeeEstimates
  isLoading: boolean
}

export function useTokenApprovalInfo(params: TokenApprovalInfoParams): TokenApprovalInfo & TokenApprovalGasInfo {
  const { account, chainId, wrapType, currencyInAmount, currencyOutAmount, routing, skip } = params

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

  const shouldSkip = skip || !approvalRequestArgs || isWrap || !address

  const { data, isLoading, error } = useCheckApprovalQuery({
    params: shouldSkip ? undefined : approvalRequestArgs,
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
        isLoading,
      }
    }

    if (data && !error) {
      // API returns null if no approval is required
      if (data.approval === null) {
        return {
          action: ApprovalAction.None,
          txRequest: null,
          cancelTxRequest: null,
          isLoading,
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

        if (data.cancel) {
          return {
            action: ApprovalAction.RevokeAndPermit2Approve,
            txRequest: data.approval,
            gasFee: data.gasFee,
            displayGasFee: convertGasFeeToDisplayValue(data.gasFee, activeGasStrategy),
            cancelTxRequest: data.cancel,
            cancelGasFee: data.cancelGasFee,
            displayCancelGasFee: convertGasFeeToDisplayValue(data.cancelGasFee, activeGasStrategy),
            isLoading,
            gasEstimates,
          }
        }

        return {
          action: ApprovalAction.Permit2Approve,
          txRequest: data.approval,
          gasFee: data.gasFee,
          displayGasFee: convertGasFeeToDisplayValue(data.gasFee, activeGasStrategy),
          gasEstimates,
          cancelTxRequest: null,
          isLoading,
        }
      }
    }

    // No valid approval type found
    return {
      action: ApprovalAction.Unknown,
      txRequest: null,
      cancelTxRequest: null,
      isLoading,
    }
  }, [activeGasStrategy, approvalRequestArgs, data, error, isWrap, isLoading])
}
