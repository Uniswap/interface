import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, TouchableArea } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { fonts } from 'ui/src/theme'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import {
  commitDraftToFloorPrice,
  exceedsDecimalCap,
  getDisplayValueForMode,
  maxDecimalsForDraftInput,
  type FloorPriceDenomination,
  type InputCurrency,
} from '~/pages/Liquidity/CreateAuction/components/floorPriceSelectorDraft'
import { RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'
import {
  formatLocalizedNumber,
  useLocalizedNumberInput,
} from '~/pages/Liquidity/CreateAuction/utils/localizedNumberInput'

export function FloorPriceSelector({
  chainId,
  floorPrice,
  raiseCurrency,
  tokenTotalSupply,
  inputCurrency,
  usdPriceNum,
  onInputCurrencyChange,
  onFloorPriceChange,
}: {
  chainId: UniverseChainId
  floorPrice: string
  raiseCurrency: RaiseCurrency
  tokenTotalSupply: CurrencyAmount<Currency>
  inputCurrency: InputCurrency
  usdPriceNum: number | null
  onInputCurrencyChange: (next: InputCurrency) => void
  onFloorPriceChange: (value: string) => void
}) {
  const { t } = useTranslation()

  const [isFocused, setIsFocused] = useState(false)
  const [denomination, setDenomination] = useState<FloorPriceDenomination>('floorPrice')
  // Local value (dot-normalized) used in all modes except floorPrice+raise,
  // where the parent's `floorPrice` prop is the direct source of truth.
  const [localValue, setLocalValue] = useState('')
  const prevRaiseCurrencyRef = useRef(raiseCurrency)
  /** True when the user cleared the draft input; avoids treating initial empty draft as "clear canonical floor price". */
  const allowEmptyCanonicalSyncRef = useRef(false)

  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const { code: fiatCurrencyCode } = useAppFiatCurrencyInfo()
  const locale = useCurrentLocale()

  const raiseCurrencyObj = useMemo(() => getRaiseCurrencyAsCurrency(raiseCurrency, chainId), [raiseCurrency, chainId])

  const decimalSeparator = useMemo(
    () =>
      Intl.NumberFormat(locale)
        .formatToParts(1.1)
        .find((p) => p.type === 'decimal')?.value ?? '.',
    [locale],
  )

  const floorPriceNum = parseFloat(floorPrice)
  const totalSupplyNum = parseFloat(tokenTotalSupply.toExact())
  const hasValidFloorPrice = Number.isFinite(floorPriceNum) && floorPriceNum > 0

  // FDV in raise currency, always derived from the canonical floorPrice prop.
  const fdvRaiseNum = hasValidFloorPrice && Number.isFinite(totalSupplyNum) ? floorPriceNum * totalSupplyNum : null

  // In floorPrice+raise mode the parent prop is the source of truth; all other modes use localValue.
  const isParentControlled = denomination === 'floorPrice' && inputCurrency === 'raise'
  const rawDisplayValue = isParentControlled ? floorPrice : localValue

  // When returning from Review (or any remount), `localValue` starts empty while the store still
  // holds canonical floor price in raise terms. Hydrate the draft from props; skip while focused so
  // we do not fight in-progress typing.
  useLayoutEffect(() => {
    if (isParentControlled || isFocused) {
      return
    }
    if (allowEmptyCanonicalSyncRef.current) {
      return
    }
    if (inputCurrency === 'usd' && usdPriceNum === null) {
      return
    }
    const display = getDisplayValueForMode({
      denomination,
      inputCurrency,
      floorPriceNum,
      totalSupplyNum,
      usdPriceNum,
      hasValidFloorPrice,
    })
    setLocalValue(display)
  }, [
    denomination,
    floorPrice,
    floorPriceNum,
    hasValidFloorPrice,
    inputCurrency,
    isFocused,
    isParentControlled,
    totalSupplyNum,
    usdPriceNum,
  ])

  // Validation+commit handler. The hook delivers the dot-decimal normalized value; we apply the
  // decimal-cap check before either writing to the parent (parent-controlled) or storing as draft.
  const handleRawChange = useCallback(
    (raw: string) => {
      if (!isParentControlled) {
        allowEmptyCanonicalSyncRef.current = raw.trim() === ''
      }
      if (isParentControlled) {
        const maxDecimals = raiseCurrencyObj?.decimals
        if (maxDecimals !== undefined && exceedsDecimalCap(raw, maxDecimals)) {
          return
        }
        onFloorPriceChange(raw)
        return
      }
      const maxDecimals = maxDecimalsForDraftInput(inputCurrency, raiseCurrencyObj?.decimals)
      if (exceedsDecimalCap(raw, maxDecimals)) {
        return
      }
      setLocalValue(raw)
    },
    [inputCurrency, isParentControlled, onFloorPriceChange, raiseCurrencyObj?.decimals],
  )

  const {
    displayValue: focusedDisplayValue,
    inputRef,
    handleChange,
  } = useLocalizedNumberInput({
    rawValue: rawDisplayValue,
    locale,
    onChangeRaw: handleRawChange,
  })

  // Draft modes commit localValue → canonical floor price on user-controlled changes.
  // `usdPriceNum` is intentionally omitted from deps (live oracle would cause drift on every tick);
  // we snapshot it at commit time. On raise-currency change we treat the draft as empty so we
  // don't push a value derived from stale `localValue` × the new token.
  useEffect(() => {
    const raiseCurrencyChanged = prevRaiseCurrencyRef.current !== raiseCurrency
    prevRaiseCurrencyRef.current = raiseCurrency

    if (raiseCurrencyChanged) {
      setLocalValue('')
    }

    if (isParentControlled) {
      return
    }

    const draftForCommit = raiseCurrencyChanged ? '' : localValue
    const next = commitDraftToFloorPrice({
      localValue: draftForCommit,
      denomination,
      inputCurrency,
      usdPriceNum,
      tokenTotalSupply,
      raiseCurrency: raiseCurrencyObj,
    })
    if (next === '' && floorPrice !== '' && !allowEmptyCanonicalSyncRef.current) {
      return
    }
    if (next !== floorPrice) {
      onFloorPriceChange(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- usdPriceNum omitted: see comment above
  }, [
    denomination,
    floorPrice,
    inputCurrency,
    isParentControlled,
    localValue,
    onFloorPriceChange,
    raiseCurrency,
    raiseCurrencyObj,
    tokenTotalSupply,
  ])

  // ─── Derived display strings ──────────────────────────────────────────────

  // Label next to the input: currency + optional "FDV" suffix.
  const inputLabel = useMemo(() => {
    const currencyStr = inputCurrency === 'usd' ? fiatCurrencyCode : raiseCurrency
    return denomination === 'fdv' ? `${currencyStr} ${t('stats.fdv')}` : currencyStr
  }, [inputCurrency, denomination, fiatCurrencyCode, raiseCurrency, t])

  // Pill: shows the other denomination in the active currency (USD when inputCurrency='usd' and
  // the oracle has resolved, otherwise raise currency).
  const pillText = useMemo(() => {
    const usdMode = inputCurrency === 'usd' && usdPriceNum !== null && usdPriceNum > 0
    const symbol = usdMode ? fiatCurrencyCode : raiseCurrency
    const raiseValue = denomination === 'floorPrice' ? fdvRaiseNum : hasValidFloorPrice ? floorPriceNum : null
    const value = usdMode && raiseValue !== null ? raiseValue * usdPriceNum : raiseValue
    const display =
      value !== null ? formatNumberOrString({ value: value.toString(), type: NumberType.TokenNonTx }) : '0'
    const suffix =
      denomination === 'floorPrice' ? t('stats.fdv') : t('toucan.createAuction.step.configureAuction.tokenPrice')
    return `${display} ${symbol} ${suffix}`
  }, [
    denomination,
    inputCurrency,
    usdPriceNum,
    fiatCurrencyCode,
    fdvRaiseNum,
    hasValidFloorPrice,
    floorPriceNum,
    raiseCurrency,
    formatNumberOrString,
    t,
  ])

  // Bottom row: shows the other currency representation.
  const bottomText = useMemo(() => {
    if (inputCurrency === 'usd') {
      // Show raise-currency equivalent.
      if (denomination === 'floorPrice') {
        const display = hasValidFloorPrice
          ? formatNumberOrString({ value: floorPrice, type: NumberType.TokenNonTx })
          : '0'
        return `${display} ${raiseCurrency}`
      }
      const display =
        fdvRaiseNum !== null
          ? formatNumberOrString({ value: fdvRaiseNum.toString(), type: NumberType.TokenNonTx })
          : '0'
      return `${display} ${raiseCurrency} ${t('stats.fdv')}`
    }
    // Show fiat equivalent.
    if (!hasValidFloorPrice || usdPriceNum === null) {
      return `${convertFiatAmountFormatted(0, NumberType.FiatTokenPrice)} ${fiatCurrencyCode}`
    }
    const raiseAmount = denomination === 'fdv' && fdvRaiseNum !== null ? fdvRaiseNum : floorPriceNum
    return `${convertFiatAmountFormatted(raiseAmount * usdPriceNum, NumberType.FiatTokenPrice)} ${fiatCurrencyCode}`
  }, [
    inputCurrency,
    denomination,
    hasValidFloorPrice,
    floorPrice,
    floorPriceNum,
    fdvRaiseNum,
    raiseCurrency,
    usdPriceNum,
    convertFiatAmountFormatted,
    fiatCurrencyCode,
    formatNumberOrString,
    t,
  ])

  // ─── Toggle handlers ──────────────────────────────────────────────────────

  // Pill: toggle denomination, keeping inputCurrency unchanged.
  const toggleDenomination = useCallback(() => {
    const next: FloorPriceDenomination = denomination === 'floorPrice' ? 'fdv' : 'floorPrice'
    const displayValue = getDisplayValueForMode({
      denomination: next,
      inputCurrency,
      floorPriceNum,
      totalSupplyNum,
      usdPriceNum,
      hasValidFloorPrice,
    })
    setLocalValue(displayValue)
    setDenomination(next)
  }, [denomination, inputCurrency, hasValidFloorPrice, floorPriceNum, totalSupplyNum, usdPriceNum])

  // Bottom row: toggle inputCurrency, keeping denomination unchanged.
  const toggleInputCurrency = useCallback(() => {
    const next: InputCurrency = inputCurrency === 'raise' ? 'usd' : 'raise'
    const displayValue = getDisplayValueForMode({
      denomination,
      inputCurrency: next,
      floorPriceNum,
      totalSupplyNum,
      usdPriceNum,
      hasValidFloorPrice,
    })
    setLocalValue(displayValue)
    onInputCurrencyChange(next)
  }, [
    inputCurrency,
    denomination,
    hasValidFloorPrice,
    floorPriceNum,
    totalSupplyNum,
    usdPriceNum,
    onInputCurrencyChange,
  ])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  // Unfocused: cap fractional digits so long conversion results (e.g. 33.33333… ETH) don't
  // break the layout. Focused Input keeps full precision so the user's typed value is preserved.
  const unfocusedDisplayValue = formatLocalizedNumber({ rawValue: rawDisplayValue, locale, maxDecimals: 8 })
  const unfocusedDisplayText = unfocusedDisplayValue.length > 0 ? unfocusedDisplayValue : `0${decimalSeparator}00`

  return (
    <Flex
      backgroundColor="$surface2"
      borderWidth={1}
      borderColor="$surface3"
      borderRadius="$rounded16"
      p="$spacing16"
      position="relative"
    >
      <Flex row gap="$spacing8" alignItems="center" justifyContent="space-between" width="100%" minWidth={0}>
        <Text variant="body3" color="$neutral2" flexShrink={1} minWidth={0} alignSelf="flex-start">
          {denomination === 'fdv'
            ? t('toucan.createAuction.step.configureAuction.floorPrice.fdv')
            : t('toucan.createAuction.step.configureAuction.floorPrice.token')}
        </Text>
        <TouchableArea onPress={toggleDenomination} flexShrink={0}>
          <Flex backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing8" py="$spacing6">
            <Text variant="buttonLabel4" color="$neutral1">
              {pillText}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
      <Flex gap="$spacing4" width="100%">
        <Flex row gap="$spacing4" alignItems="center" width="100%" minWidth={0}>
          {isFocused ? (
            <Input
              ref={inputRef}
              autoFocus
              height={fonts.heading3.lineHeight}
              $platform-web={{
                fieldSizing: 'content',
                minWidth: '1ch',
                maxWidth: '100%',
              }}
              value={focusedDisplayValue}
              onChangeText={handleChange}
              onBlur={handleBlur}
              placeholder={`0${decimalSeparator}00`}
              placeholderTextColor="$neutral3"
              keyboardType="decimal-pad"
              fontSize={fonts.heading3.fontSize}
              lineHeight={fonts.heading3.lineHeight}
              fontWeight={fonts.heading3.fontWeight}
              color="$neutral1"
              px="$none"
              backgroundColor="$transparent"
            />
          ) : (
            <Text
              variant="heading3"
              color={unfocusedDisplayValue.length > 0 ? '$neutral1' : '$neutral3'}
              cursor="text"
              onPress={handleFocus}
            >
              {unfocusedDisplayText}
            </Text>
          )}
          <Text variant="heading3" color="$neutral2" flexShrink={0}>
            {inputLabel}
          </Text>
        </Flex>
        <TouchableArea onPress={toggleInputCurrency}>
          <Flex row alignItems="center" gap="$spacing4">
            <Text variant="subheading2" color="$neutral2">
              {bottomText}
            </Text>
            <ArrowDownArrowUp color="$neutral2" size="$icon.16" />
          </Flex>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
