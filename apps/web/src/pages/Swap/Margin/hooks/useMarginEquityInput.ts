import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { useEffect, useMemo, useState } from 'react'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { isMaxPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import {
  getMarginEquityCurrency,
  getMarginEquityCurrencyInfo,
  getMarketDefaultPaymentToken,
  getPaymentCurrency,
  getSpendablePaymentBalance,
  isPaymentTokenDifferentFromCollateral,
} from '~/features/margin/utils/marginCurrencies'
import type { DerivedMarginInfo } from '~/pages/Swap/Margin/hooks/useDerivedMarginInfo'

/**
 * Pay token → collateral, through each one's USD price. Each price quotes in its own chain's primary
 * stablecoin, and a pay token on a bridge source chain doesn't share mainnet's, so the two are bridged
 * at par. Undefined until both prices are known.
 */
function paymentToEquityPrice({
  paymentUsdPrice,
  equityUsdPrice,
}: {
  paymentUsdPrice: Price<Currency, Currency> | undefined
  equityUsdPrice: Price<Currency, Currency> | undefined
}): Price<Currency, Currency> | undefined {
  if (!paymentUsdPrice || !equityUsdPrice) {
    return undefined
  }
  const paymentUsd = paymentUsdPrice.quoteCurrency
  const equityUsd = equityUsdPrice.quoteCurrency
  const inEquityUsd = paymentUsd.equals(equityUsd)
    ? paymentUsdPrice
    : paymentUsdPrice.multiply(
        new Price(
          paymentUsd,
          equityUsd,
          (10n ** BigInt(paymentUsd.decimals)).toString(),
          (10n ** BigInt(equityUsd.decimals)).toString(),
        ),
      )
  return inEquityUsd.multiply(equityUsdPrice.invert())
}

// The Margin input as typed, in collateral units, tagged with the pay token it was entered against and
// the `marginAmount` it wrote ('' until both prices are known). Shown only while both still match: any
// other write to the amount (a preset, a finished plan's reset) or to the pay token falls back to the
// store amount restated. Local to the form body, which a pair switch remounts.
interface TypedEquity {
  amount: string
  paymentCurrencyId: string
  marginAmount: string
}

interface MarginEquityInput {
  equityCurrencyInfo: CurrencyInfo
  value: string
  currencyAmount?: CurrencyAmount<Currency>
  // The spendable pay balance, restated in the collateral.
  balance?: CurrencyAmount<Currency>
  onSetExactAmount: (amount: string) => void
  // Ignores the panel's amount: presets are taken in exact pay units off the spendable balance, so Max
  // is the balance itself rather than a restated-and-back figure that could overshoot it.
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
  selectPaymentToken: (token: MarginPaymentToken | undefined) => void
}

/**
 * The Margin input reads in the market's collateral while the store's `marginAmount`, and the quote,
 * stay in the pay token's units. Paying with the collateral itself is a pass-through. Otherwise the
 * typed text is held here and its pay-token equivalent written to the store; a figure that couldn't be
 * priced yet (prices still loading, or a Pay with switch) is priced once both prices are known, never
 * re-priced on a tick, so the quote key holds still.
 */
export function useMarginEquityInput({
  derivedMarginInfo,
}: {
  derivedMarginInfo: Pick<
    DerivedMarginInfo,
    'market' | 'paymentToken' | 'paymentCurrency' | 'balance' | 'isPaymentDifferentFromCollateral'
  >
}): MarginEquityInput {
  const { market, paymentToken, paymentCurrency, balance: paymentBalance } = derivedMarginInfo
  const isPayDifferent = derivedMarginInfo.isPaymentDifferentFromCollateral
  const marginAmount = useMarginFormStore((s) => s.marginAmount)
  const { setMarginFormState } = useMarginFormStoreActions()
  const [typed, setTyped] = useState<TypedEquity | undefined>(undefined)

  const equityCurrency = useMemo(() => getMarginEquityCurrency(market), [market])
  const equityCurrencyInfo = useCurrencyInfo(currencyId(equityCurrency)) ?? getMarginEquityCurrencyInfo(market)
  const paymentCurrencyKey = currencyId(paymentCurrency)

  const { price: equityUsdPrice } = useUSDCPrice(equityCurrency)
  const { price: paymentUsdPrice } = useUSDCPrice(paymentCurrency)
  const paymentToEquity = useMemo(
    () => paymentToEquityPrice({ paymentUsdPrice, equityUsdPrice }),
    [paymentUsdPrice, equityUsdPrice],
  )
  const isPriced = paymentToEquity !== undefined

  // Collateral text → pay-token text. '' for an empty or unparseable entry; undefined while unpriceable.
  // `toExact` floors, so the pay amount written never exceeds the collateral typed.
  const toPaymentAmount = (equityText: string): string | undefined => {
    const equityAmount = getCurrencyAmount({ value: equityText, valueType: ValueType.Exact, currency: equityCurrency })
    if (!equityAmount) {
      return ''
    }
    return paymentToEquity?.invert().quote(equityAmount).toExact()
  }

  // Pay-token amount → collateral, floored to whole collateral units. undefined while unpriceable.
  const toEquityAmount = (paymentAmount: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined =>
    paymentToEquity
      ? CurrencyAmount.fromRawAmount(equityCurrency, paymentToEquity.quote(paymentAmount).quotient)
      : undefined

  const storedPaymentAmount = getCurrencyAmount({
    value: marginAmount,
    valueType: ValueType.Exact,
    currency: paymentCurrency,
  })
  const isTypedCurrent = typed?.paymentCurrencyId === paymentCurrencyKey && typed.marginAmount === marginAmount
  const value = !isPayDifferent
    ? marginAmount
    : isTypedCurrent
      ? typed.amount
      : storedPaymentAmount
        ? (toEquityAmount(storedPaymentAmount)?.toExact() ?? '')
        : ''
  const currencyAmount = getCurrencyAmount({ value, valueType: ValueType.Exact, currency: equityCurrency }) ?? undefined

  const spendablePaymentBalance = getSpendablePaymentBalance({ paymentToken, balance: paymentBalance })
  const balance =
    isPayDifferent && spendablePaymentBalance ? toEquityAmount(spendablePaymentBalance) : spendablePaymentBalance

  const onSetExactAmount = useEvent((amount: string) => {
    if (!isPayDifferent) {
      setMarginFormState({ marginAmount: amount })
      return
    }
    // Unpriceable: clear marginAmount, so a stale pay amount (e.g. from a preset) isn't quoted under the
    // new figure; the pricing effect writes it once both prices are known.
    const paymentAmount = toPaymentAmount(amount) ?? ''
    setTyped({ amount, paymentCurrencyId: paymentCurrencyKey, marginAmount: paymentAmount })
    setMarginFormState({ marginAmount: paymentAmount })
  })

  const onSetPresetValue = useEvent((_amount: string, percentage: PresetPercentage) => {
    if (!spendablePaymentBalance) {
      return
    }
    const presetAmount = isMaxPercentage(percentage)
      ? spendablePaymentBalance
      : spendablePaymentBalance.multiply(percentage).divide(100)
    // The input derives its collateral figure from this exact pay amount.
    setTyped(undefined)
    setMarginFormState({ marginAmount: presetAmount.toExact() })
  })

  // Keeps the collateral amount on screen across the switch. A different pay token can't be priced
  // until this hook re-renders against it, so its amount is cleared rather than left in the old token's
  // units, and the pricing effect fills it in.
  const selectPaymentToken = useEvent((token: MarginPaymentToken | undefined) => {
    const nextToken = token ?? getMarketDefaultPaymentToken(market)
    const nextCurrencyId = currencyId(getPaymentCurrency(nextToken))
    if (nextCurrencyId === paymentCurrencyKey) {
      setMarginFormState({ paymentToken: token })
      return
    }
    if (!isPaymentTokenDifferentFromCollateral({ token: nextToken, market })) {
      setTyped(undefined)
      setMarginFormState({ paymentToken: token, marginAmount: value })
      return
    }
    setTyped(value === '' ? undefined : { amount: value, paymentCurrencyId: nextCurrencyId, marginAmount: '' })
    setMarginFormState({ paymentToken: token, marginAmount: '' })
  })

  // Prices a figure held unpriced, once both prices are known and only while it is still the one shown.
  const priceTyped = useEvent(() => {
    if (!isPayDifferent || !isTypedCurrent || typed.marginAmount !== '') {
      return
    }
    const paymentAmount = toPaymentAmount(typed.amount)
    if (paymentAmount) {
      setTyped({ ...typed, marginAmount: paymentAmount })
      setMarginFormState({ marginAmount: paymentAmount })
    }
  })
  useEffect(() => {
    priceTyped()
  }, [isPayDifferent, typed, paymentCurrencyKey, marginAmount, isPriced, priceTyped])

  return {
    equityCurrencyInfo,
    value,
    currencyAmount,
    balance,
    onSetExactAmount,
    onSetPresetValue,
    selectPaymentToken,
  }
}
