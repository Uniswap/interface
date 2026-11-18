import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { useEffect, useMemo, useState } from 'react'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { isMaxPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
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

// The Margin input as typed (dollars in fiat mode, else collateral units), tagged with the pay token it
// was entered against and the `marginAmount` it wrote ('' until the price it needs is known). Shown only while both still match: any
// other write to the amount (a preset, a finished plan's reset) or to the pay token falls back to the
// store amount restated. Local to the form body, which a pair switch remounts.
interface TypedEquity {
  amount: string
  isFiat: boolean
  paymentCurrencyId: string
  marginAmount: string
}

interface MarginEquityInput {
  equityCurrencyInfo: CurrencyInfo
  // Dollars first: the deposit is restated from whatever is paid with, so only dollars read the same for
  // every pay token. CurrencyInputPanel's own fiat mode shows the collateral figure under it.
  isFiatMode: boolean
  // A dollar figure can be priced into the pay token.
  canEnterFiat: boolean
  value: string
  // The collateral amount the input stands for, in either mode.
  currencyAmount?: CurrencyAmount<Currency>
  // The spendable pay balance, restated in the collateral.
  balance?: CurrencyAmount<Currency>
  // Max has a spendable pay balance to take: a native one at or under the gas reserve has none.
  canMax: boolean
  onSetExactAmount: (amount: string) => void
  // Ignores the panel's amount: presets are taken in exact pay units off the spendable balance, so Max
  // is the balance itself rather than a restated-and-back figure that could overshoot it.
  onSetPresetValue: (amount: string, percentage: PresetPercentage) => void
  // An amount in the app's fiat currency, as the preset pill labels it.
  onSetFiatPreset: (amount: number) => void
  onToggleIsFiatMode: () => void
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
  initialFiatMode = true,
}: {
  derivedMarginInfo: Pick<
    DerivedMarginInfo,
    'market' | 'paymentToken' | 'paymentCurrency' | 'balance' | 'isPaymentDifferentFromCollateral'
  >
  initialFiatMode?: boolean
}): MarginEquityInput {
  const { market, paymentToken, paymentCurrency, balance: paymentBalance } = derivedMarginInfo
  const isPayDifferent = derivedMarginInfo.isPaymentDifferentFromCollateral
  const marginAmount = useMarginFormStore((s) => s.marginAmount)
  const depositFiat = useMarginFormStore((s) => s.depositFiat)
  const { setMarginFormState } = useMarginFormStoreActions()
  const [typed, setTyped] = useState<TypedEquity | undefined>(undefined)
  const [isFiatMode, setIsFiatMode] = useState(initialFiatMode)

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
  // Fiat text is in the app's currency (what the panel labels it); prices quote US dollars. 1 for USD.
  const { convertFiatAmount } = useLocalizationContext()
  const fiatPerUsd = convertFiatAmount(1).amount

  // Typed text → pay-token text. '' for an empty or unparseable entry; undefined while unpriceable.
  // `toExact` floors, so the pay amount written never exceeds the figure typed.
  const toPaymentAmount = (text: string, isFiat: boolean): string | undefined => {
    const price = isFiat ? paymentUsdPrice?.invert() : paymentToEquity?.invert()
    const currency = isFiat ? paymentUsdPrice?.quoteCurrency : equityCurrency
    // App-currency text restated in dollars; left as typed when it doesn't parse ('', '.').
    const usd = parseFloat(text) / fiatPerUsd
    const value = isFiat && currency && Number.isFinite(usd) ? usd.toFixed(currency.decimals) : text
    const amount = currency && getCurrencyAmount({ value, valueType: ValueType.Exact, currency })
    if (!amount) {
      return currency ? '' : undefined
    }
    return price?.quote(amount).toExact()
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
  const equityValue = !isPayDifferent
    ? marginAmount
    : isTypedCurrent && !typed.isFiat
      ? typed.amount
      : storedPaymentAmount
        ? (toEquityAmount(storedPaymentAmount)?.toExact() ?? '')
        : ''
  // Two places, trailing zeros trimmed ("23.49", "100").
  const fiatValue =
    isTypedCurrent && typed.isFiat
      ? typed.amount
      : storedPaymentAmount && paymentUsdPrice
        ? (Number(paymentUsdPrice.quote(storedPaymentAmount).toExact()) * fiatPerUsd).toFixed(2).replace(/\.?0+$/, '')
        : ''
  const value = isFiatMode ? fiatValue : equityValue
  const currencyAmount =
    getCurrencyAmount({ value: equityValue, valueType: ValueType.Exact, currency: equityCurrency }) ?? undefined

  const spendablePaymentBalance = getSpendablePaymentBalance({ paymentToken, balance: paymentBalance })
  const balance =
    isPayDifferent && spendablePaymentBalance ? toEquityAmount(spendablePaymentBalance) : spendablePaymentBalance

  const enter = (amount: string, isFiat: boolean): void => {
    if (!isFiat && !isPayDifferent) {
      setMarginFormState({ marginAmount: amount })
      return
    }
    // Unpriceable: clear marginAmount, so a stale pay amount (e.g. from a preset) isn't quoted under the
    // new figure; the pricing effect writes it once the price is known.
    const paymentAmount = toPaymentAmount(amount, isFiat) ?? ''
    setTyped({ amount, isFiat, paymentCurrencyId: paymentCurrencyKey, marginAmount: paymentAmount })
    setMarginFormState({ marginAmount: paymentAmount })
  }
  const onSetExactAmount = useEvent((amount: string) => enter(amount, isFiatMode))
  const onSetFiatPreset = useEvent((amount: number) => enter(String(amount), true))
  // The amount stays; only its reading changes.
  const onToggleIsFiatMode = useEvent(() => {
    setTyped(undefined)
    setIsFiatMode((prev) => !prev)
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
    if (!isFiatMode && !isPaymentTokenDifferentFromCollateral({ token: nextToken, market })) {
      setTyped(undefined)
      setMarginFormState({ paymentToken: token, marginAmount: value })
      return
    }
    setTyped(
      value === ''
        ? undefined
        : { amount: value, isFiat: isFiatMode, paymentCurrencyId: nextCurrencyId, marginAmount: '' },
    )
    setMarginFormState({ paymentToken: token, marginAmount: '' })
  })

  // Prices a figure held unpriced, once the price it needs is known and only while it is still the one shown.
  const priceTyped = useEvent(() => {
    if (!isTypedCurrent || typed.marginAmount !== '') {
      return
    }
    const paymentAmount = toPaymentAmount(typed.amount, typed.isFiat)
    if (paymentAmount) {
      setTyped({ ...typed, marginAmount: paymentAmount })
      setMarginFormState({ marginAmount: paymentAmount })
    }
  })
  useEffect(() => {
    priceTyped()
  }, [isPayDifferent, typed, paymentCurrencyKey, marginAmount, isPriced, paymentUsdPrice, priceTyped])

  // depositFiat carries the deposit across a pair or Long/Short switch. Example: depositing 200 USDC
  // stores depositFiat '200'. Switching to a market paid in ETH remounts this hook with marginAmount ''
  // (200 means nothing in ETH), so enterCarried re-enters '200' as fiat: at $4,000/ETH marginAmount
  // becomes '0.05'. Effect order doesn't matter: enterCarried reads this render's depositFiat, so the
  // mirror below writing '' on mount can't erase it.
  const enterCarried = useEvent(() => {
    if (marginAmount === '' && depositFiat) {
      enter(depositFiat, true)
    }
  })
  useEffect(() => {
    enterCarried()
  }, [enterCarried])
  // Mirrors every edit into the store (typing $150 stores '150') so the next remount has it.
  useEffect(() => {
    setMarginFormState({ depositFiat: fiatValue })
  }, [fiatValue, setMarginFormState])

  return {
    equityCurrencyInfo,
    isFiatMode,
    canEnterFiat: paymentUsdPrice !== undefined,
    value,
    currencyAmount,
    balance,
    canMax: Boolean(spendablePaymentBalance?.greaterThan(0)),
    onSetExactAmount,
    onSetPresetValue,
    onSetFiatPreset,
    onToggleIsFiatMode,
    selectPaymentToken,
  }
}
