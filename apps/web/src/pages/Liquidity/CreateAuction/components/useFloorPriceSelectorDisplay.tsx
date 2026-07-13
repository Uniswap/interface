import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import type {
  FloorPriceDenomination,
  InputCurrency,
} from '~/pages/Liquidity/CreateAuction/components/floorPriceSelectorDraft'

/** Subscript when there are this many leading zeros after the decimal (pill, bottom row, unfocused main value). */
export const FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD = 3

interface UseFloorPriceSelectorDisplayParams {
  denomination: FloorPriceDenomination
  inputCurrency: InputCurrency
  fiatCurrencyCode: string
  /** Resolved ticker of the raise currency (e.g. ETH, AVAX, USDG) — never the RaiseCurrency slot name. */
  raiseCurrencySymbol: string
  usdPriceNum: number | null
  fdvRaiseNum: number | null
  hasValidFloorPrice: boolean
  floorPriceNum: number
}

/** Pill + bottom row + (in FloorPriceSelector) unfocused main value use {@link FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}. */
export function useFloorPriceSelectorDisplay({
  denomination,
  inputCurrency,
  fiatCurrencyCode,
  raiseCurrencySymbol,
  usdPriceNum,
  fdvRaiseNum,
  hasValidFloorPrice,
  floorPriceNum,
}: UseFloorPriceSelectorDisplayParams): {
  inputLabel: string
  pillContent: ReactNode
  bottomRowContent: ReactNode | null
} {
  const { t } = useTranslation()

  const inputLabel = useMemo(() => {
    const currencyStr = inputCurrency === 'usd' ? fiatCurrencyCode : raiseCurrencySymbol
    return denomination === 'fdv' ? `${currencyStr} ${t('stats.fdv')}` : currencyStr
  }, [inputCurrency, denomination, fiatCurrencyCode, raiseCurrencySymbol, t])

  const pillContent = useMemo((): ReactNode => {
    const usdMode = inputCurrency === 'usd' && usdPriceNum !== null && usdPriceNum > 0
    const symbol = usdMode ? fiatCurrencyCode : raiseCurrencySymbol
    const raiseValue = denomination === 'floorPrice' ? fdvRaiseNum : hasValidFloorPrice ? floorPriceNum : null
    const value = usdMode && raiseValue !== null ? raiseValue * usdPriceNum : raiseValue
    const suffix =
      denomination === 'floorPrice' ? t('stats.fdv') : t('toucan.createAuction.step.configureAuction.tokenPrice')

    if (value === null) {
      return (
        <Text variant="buttonLabel4" color="$neutral1">
          0 {symbol} {suffix}
        </Text>
      )
    }

    if (usdMode) {
      return (
        <>
          <SubscriptZeroPrice
            value={value}
            symbol={symbol}
            variant="buttonLabel4"
            color="$neutral1"
            minSignificantDigits={1}
            maxSignificantDigits={4}
            subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
            disableTooltip
          />
          <Text variant="buttonLabel4" color="$neutral1">
            {suffix}
          </Text>
        </>
      )
    }

    return (
      <>
        <SubscriptZeroPrice
          value={value}
          symbol={symbol}
          variant="buttonLabel4"
          color="$neutral1"
          minSignificantDigits={1}
          maxSignificantDigits={3}
          subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
          disableTooltip
        />
        <Text variant="buttonLabel4" color="$neutral1">
          {suffix}
        </Text>
      </>
    )
  }, [
    denomination,
    inputCurrency,
    usdPriceNum,
    fiatCurrencyCode,
    fdvRaiseNum,
    hasValidFloorPrice,
    floorPriceNum,
    raiseCurrencySymbol,
    t,
  ])

  const bottomRowContent = useMemo((): ReactNode | null => {
    if (inputCurrency === 'usd') {
      if (denomination === 'floorPrice') {
        if (!hasValidFloorPrice) {
          return (
            <Text variant="subheading2" color="$neutral2">
              0 {raiseCurrencySymbol}
            </Text>
          )
        }
        return (
          <SubscriptZeroPrice
            value={floorPriceNum}
            symbol={raiseCurrencySymbol}
            variant="subheading2"
            color="$neutral2"
            minSignificantDigits={1}
            maxSignificantDigits={3}
            subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
            disableTooltip
          />
        )
      }
      if (fdvRaiseNum !== null && fdvRaiseNum > 0) {
        return (
          <>
            <SubscriptZeroPrice
              value={fdvRaiseNum}
              symbol={raiseCurrencySymbol}
              variant="subheading2"
              color="$neutral2"
              minSignificantDigits={1}
              maxSignificantDigits={3}
              subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
              disableTooltip
            />
            <Text variant="subheading2" color="$neutral2">
              {t('stats.fdv')}
            </Text>
          </>
        )
      }
      return (
        <Text variant="subheading2" color="$neutral2">
          0 {raiseCurrencySymbol} {t('stats.fdv')}
        </Text>
      )
    }
    if (usdPriceNum === null) {
      return null
    }
    if (!hasValidFloorPrice) {
      return (
        <SubscriptZeroPrice
          value={0}
          symbol={fiatCurrencyCode}
          variant="subheading2"
          color="$neutral2"
          minSignificantDigits={1}
          maxSignificantDigits={4}
          subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
          disableTooltip
        />
      )
    }
    const raiseAmount = denomination === 'fdv' && fdvRaiseNum !== null ? fdvRaiseNum : floorPriceNum
    return (
      <SubscriptZeroPrice
        value={raiseAmount * usdPriceNum}
        symbol={fiatCurrencyCode}
        variant="subheading2"
        color="$neutral2"
        minSignificantDigits={1}
        maxSignificantDigits={4}
        subscriptThreshold={FLOOR_PRICE_SELECTOR_SUBSCRIPT_THRESHOLD}
        disableTooltip
      />
    )
  }, [
    inputCurrency,
    denomination,
    hasValidFloorPrice,
    floorPriceNum,
    fdvRaiseNum,
    raiseCurrencySymbol,
    usdPriceNum,
    fiatCurrencyCode,
    t,
  ])

  return {
    inputLabel,
    pillContent,
    bottomRowContent,
  }
}
