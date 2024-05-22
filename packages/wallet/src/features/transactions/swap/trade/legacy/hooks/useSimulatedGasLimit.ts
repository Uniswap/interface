import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useDebounceWithStatus } from 'utilities/src/time/timing'
import { SimulatedGasEstimationInfo } from 'wallet/src/features/gas/types'
import { useRouterQuote } from 'wallet/src/features/transactions/swap/trade/legacy/hooks/useRouterQuote'
import { PermitSignatureInfo } from 'wallet/src/features/transactions/swap/usePermit2Signature'
import { QuoteType } from 'wallet/src/features/transactions/utils'

export function useSimulatedGasLimit(
  amountSpecified: Maybe<CurrencyAmount<Currency>>,
  otherCurrency: Maybe<Currency>,
  tradeType: TradeType,
  skip: boolean,
  permitSignatureInfo: Maybe<PermitSignatureInfo>,
  customSlippageTolerance?: number
): SimulatedGasEstimationInfo {
  const [debouncedAmountSpecified, isDebouncing] = useDebounceWithStatus(amountSpecified)

  const { loading, error, data } = useRouterQuote({
    amountSpecified: debouncedAmountSpecified,
    otherCurrency,
    tradeType,
    skip,
    fetchSimulatedGasLimit: true,
    permitSignatureInfo,
    customSlippageTolerance,
  })

  // Enforce routing api quote type
  const quote =
    data?.trade.quoteData?.quoteType === QuoteType.RoutingApi
      ? data?.trade.quoteData.quote
      : undefined

  return useMemo(
    () => ({
      loading: loading || isDebouncing,
      error: error || data?.simulationError,
      quoteId: quote?.quoteId,
      requestId: quote?.requestId,
      simulatedGasLimit: data?.gasUseEstimate,
    }),
    [
      loading,
      isDebouncing,
      error,
      data?.simulationError,
      data?.gasUseEstimate,
      quote?.quoteId,
      quote?.requestId,
    ]
  )
}
