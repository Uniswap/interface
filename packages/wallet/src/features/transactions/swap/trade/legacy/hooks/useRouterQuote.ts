import { TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { GqlResult } from 'uniswap/src/data/types'
import {
  RoutingIntent,
  TradeQuoteRequest,
  useQuoteQuery,
} from 'wallet/src/features/transactions/swap/trade/legacy/api'
import { TradeQuoteResult } from 'wallet/src/features/transactions/swap/trade/legacy/types'
import { UseTradeArgs } from 'wallet/src/features/transactions/swap/trade/types'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import {
  areCurrencyIdsEqual,
  currencyAddressForSwapQuote,
  currencyId,
} from 'wallet/src/utils/currencyId'

interface UseQuoteProps extends UseTradeArgs {
  skip?: boolean
  fetchSimulatedGasLimit?: boolean
  permitSignatureInfo?: PermitSignatureInfo | null
}

// Fetches quote from Routing API
export function useRouterQuote(params: UseQuoteProps): GqlResult<TradeQuoteResult> {
  const recipient = useActiveAccount()

  const {
    amountSpecified,
    tradeType,
    otherCurrency,
    pollInterval,
    skip,
    fetchSimulatedGasLimit,
    permitSignatureInfo,
    customSlippageTolerance,
    isUSDQuote,
    sendPortionEnabled,
  } = params

  const currencyIn = tradeType === TradeType.EXACT_INPUT ? amountSpecified?.currency : otherCurrency
  const currencyOut =
    tradeType === TradeType.EXACT_OUTPUT ? amountSpecified?.currency : otherCurrency

  const tokenInAddress = currencyIn ? currencyAddressForSwapQuote(currencyIn) : undefined
  const tokenInChainId = currencyIn?.chainId
  const tokenOutAddress = currencyOut ? currencyAddressForSwapQuote(currencyOut) : undefined
  const tokenOutChainId = currencyOut?.chainId

  const currencyInEqualsCurrencyOut =
    currencyIn &&
    currencyOut &&
    areCurrencyIdsEqual(currencyId(currencyIn), currencyId(currencyOut))

  const skipQuery =
    skip ||
    !amountSpecified ||
    !tokenInAddress ||
    !tokenOutAddress ||
    !tokenInChainId ||
    !tokenOutChainId ||
    currencyInEqualsCurrencyOut

  const request: TradeQuoteRequest | undefined = useMemo(() => {
    if (skipQuery) {
      return undefined
    }

    return {
      enableUniversalRouter: true,
      tokenInAddress,
      tokenInChainId,
      tokenOutAddress,
      tokenOutChainId,
      amount: amountSpecified.quotient.toString(),
      type: tradeType === TradeType.EXACT_INPUT ? 'exactIn' : 'exactOut',
      recipient: recipient?.address,
      fetchSimulatedGasLimit,
      permitSignatureInfo,
      slippageTolerance: customSlippageTolerance,
      loggingProperties: {
        isUSDQuote,
      },
      sendPortionEnabled,
      intent: isUSDQuote ? RoutingIntent.Pricing : RoutingIntent.Quote,
    }
  }, [
    amountSpecified?.quotient,
    customSlippageTolerance,
    fetchSimulatedGasLimit,
    isUSDQuote,
    permitSignatureInfo,
    recipient?.address,
    skipQuery,
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
    tradeType,
    sendPortionEnabled,
  ])

  const result = useQuoteQuery(request, { pollInterval })

  return result
}
