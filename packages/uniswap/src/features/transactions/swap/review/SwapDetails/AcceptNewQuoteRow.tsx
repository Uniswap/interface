import { SharedEventName } from '@uniswap/analytics-events'
import { AcceptQuoteRow } from '@universe/transactions-ui'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

/** The price change since the accepted quote, like `(+0.52%)`. Undefined when either amount is missing. */
export function getPriceChangeText({
  derivedSwapInfo,
  acceptedDerivedSwapInfo,
}: {
  derivedSwapInfo: Pick<DerivedSwapInfo<CurrencyInfo, CurrencyInfo>, 'currencyAmounts' | 'exactCurrencyField'>
  acceptedDerivedSwapInfo: Pick<DerivedSwapInfo<CurrencyInfo, CurrencyInfo>, 'currencyAmounts'>
}): string | undefined {
  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  // It's important to convert these to fractions before doing math on them in order to preserve full precision on each step.
  const newAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction
  const acceptedAmount = acceptedDerivedSwapInfo.currencyAmounts[derivedCurrencyField]?.asFraction

  if (!newAmount || !acceptedAmount) {
    return undefined
  }

  const percentage = newAmount.subtract(acceptedAmount).divide(acceptedAmount).multiply(100)

  return `(${percentage.greaterThan(0) ? '+' : ''}${percentage.toFixed(2)}%)`
}

/** Adapter: maps the two swap infos onto AcceptQuoteRow and logs the accept press. */
export function AcceptNewQuoteRow({
  acceptedDerivedSwapInfo,
  derivedSwapInfo,
  onAcceptTrade,
}: {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  derivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  onAcceptTrade: () => void
}): JSX.Element {
  const { formatCurrencyAmount } = useLocalizationContext()
  const trace = useTrace()

  const derivedCurrencyField =
    derivedSwapInfo.exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const derivedAmount = derivedSwapInfo.currencyAmounts[derivedCurrencyField]
  const derivedSymbol = getSymbolDisplayText(derivedSwapInfo.currencies[derivedCurrencyField]?.currency.symbol)
  const formattedDerivedAmount = formatCurrencyAmount({
    value: derivedAmount,
    type: NumberType.TokenTx,
  })

  const changeText = getPriceChangeText({
    derivedSwapInfo,
    acceptedDerivedSwapInfo,
  })

  // Replaces the old `<Trace logPress>` wrapper: Trace injects its press handler onto the child
  // element, which a props-driven view would silently ignore. Same event and payload.
  const onAccept = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AcceptNewRate })
    onAcceptTrade()
  })

  return (
    <AcceptQuoteRow
      changeText={changeText}
      value={`${formattedDerivedAmount} ${derivedSymbol ?? ''}`}
      onAccept={onAccept}
    />
  )
}
