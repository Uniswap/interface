import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import { GqlResult } from 'wallet/src/features/dataApi/types'
import { TradeQuoteRequest, useQuoteQuery } from 'wallet/src/features/routing/api'
import { TradeQuoteResult } from 'wallet/src/features/routing/types'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'
import {
  areCurrencyIdsEqual,
  currencyAddressForSwapQuote,
  currencyId,
} from 'wallet/src/utils/currencyId'

export interface UseQuoteProps {
  amountSpecified: CurrencyAmount<Currency> | null | undefined
  otherCurrency: Currency | null | undefined
  tradeType: TradeType
  pollingInterval?: PollingInterval
  skip?: boolean
  fetchSimulatedGasLimit?: boolean
  permitSignatureInfo?: PermitSignatureInfo | null
  customSlippageTolerance?: number
  isUSDQuote?: boolean
}

// Fetches quote from Routing API
export function useRouterQuote(params: UseQuoteProps): GqlResult<TradeQuoteResult> {
  const recipient = useActiveAccount()

  const {
    amountSpecified,
    tradeType,
    otherCurrency,
    pollingInterval = PollingInterval.Fast,
    skip,
    fetchSimulatedGasLimit,
    permitSignatureInfo,
    customSlippageTolerance,
    isUSDQuote,
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
  ])

  const result = useQuoteQuery(request, {
    pollInterval: pollingInterval,
  })

  return result
}

const SWAP_GAS_LIMIT_FALLBACKS: Record<ChainId, string> = {
  [ChainId.Mainnet]: '420000',
  [ChainId.Goerli]: '420000',
  [ChainId.ArbitrumOne]: '1200000',
  [ChainId.Base]: '420000',
  [ChainId.Bnb]: '1200000',
  [ChainId.Optimism]: '420000',
  [ChainId.Polygon]: '420000',
  [ChainId.PolygonMumbai]: '420000',
}

export function useSimulatedGasLimit(
  chainId: ChainId,
  amountSpecified: CurrencyAmount<Currency> | null | undefined,
  otherCurrency: Currency | null | undefined,
  tradeType: TradeType,
  skip: boolean,
  permitSignatureInfo?: PermitSignatureInfo | null
): {
  isLoading: boolean
  error?: boolean | FetchBaseQueryError | SerializedError
  simulatedGasLimit: string
  gasFallbackUsed: boolean
} {
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  const { loading, error, data } = useRouterQuote({
    amountSpecified: debouncedAmountSpecified,
    otherCurrency,
    tradeType,
    skip,
    fetchSimulatedGasLimit: true,
    permitSignatureInfo,
  })

  return useMemo(
    () => ({
      isLoading: loading || isDebouncing,
      error: error || data?.simulationError,
      // if there is a simulation error, gasUseEstimate will be the router-api estimate instead of the accurate
      // Tenderly estimate, and the router-api estimate isn't accurate enough for submitting on-chain
      // instead, fall back to one of our hard-coded estimates
      simulatedGasLimit:
        (data && !data.simulationError && data.gasUseEstimate) || SWAP_GAS_LIMIT_FALLBACKS[chainId],
      gasFallbackUsed: !skip && !!data?.simulationError,
    }),
    [loading, isDebouncing, error, data, chainId, skip]
  )
}
