import { SharedEventName } from '@uniswap/analytics-events'
import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { PercentButton } from '~/pages/Liquidity/CreateAuction/components/PercentButton'
import {
  expandCompactNumberInput,
  inputExceedsCurrencyPrecision,
  isAllowedCompactNumberInput,
  percentOfAmount,
  truncateSymbol,
} from '~/pages/Liquidity/CreateAuction/utils'
import {
  formatLocalizedNumber,
  useLocalizedNumberInput,
} from '~/pages/Liquidity/CreateAuction/utils/localizedNumberInput'

const QUICK_SELECT_PERCENTS = [10, 25, 50] as const

/**
 * Parses a suffixed input string into a CurrencyAmount with exact precision.
 */
function parseSuffixedAmount(input: string, currency: Currency): CurrencyAmount<Currency> | null {
  const expanded = expandCompactNumberInput(input)
  if (!expanded) {
    return null
  }
  return tryParseCurrencyAmount(expanded, currency) ?? null
}

interface AuctionSupplySelectorProps {
  auctionSupplyAmount: CurrencyAmount<Currency>
  tokenTotalSupply: CurrencyAmount<Currency>
  /**
   * Ceiling the deposit is clamped to. For a new token this is the full minted supply; for an
   * existing token it is the connected wallet's held balance (what the auction can actually pull).
   * The "Max" preset and percent presets are computed against this, not the total supply.
   */
  maxAuctionSupplyAmount: CurrencyAmount<Currency>
  /** Smallest deposit whose sold/LP split keeps both legs at >= 1 base unit; clamped to on blur. */
  minAuctionSupplyAmount: CurrencyAmount<Currency>
  tokenSymbol: string
  /** Show the "Total supply: X" subtitle. Hidden for new tokens — a dedicated Total supply input sits above. LP-960. */
  showTotalSupply?: boolean
  onSelectPercent: (percent: number) => void
  onAmountChange: (amount: CurrencyAmount<Currency>) => void
}

export function AuctionSupplySelector({
  auctionSupplyAmount,
  tokenTotalSupply,
  maxAuctionSupplyAmount,
  minAuctionSupplyAmount,
  tokenSymbol,
  showTotalSupply = true,
  onSelectPercent,
  onAmountChange,
}: AuctionSupplySelectorProps) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const locale = useCurrentLocale()

  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const currency = tokenTotalSupply.currency

  // Input display: locale separators, no compact suffixes ("1.23K"), no truncation of integer part.
  // The unfocused view caps fractional digits to keep the line short; the focused Input (via the
  // hook) uses full precision so the user always sees their exact typed value while editing.
  const displayUnfocused = formatLocalizedNumber({
    rawValue: auctionSupplyAmount.toExact(),
    locale,
    maxDecimals: 4,
  })
  // Subtitle (Total supply): keeps the original compact stats formatter — this is a reference number,
  // not the editable amount, so abbreviating large supplies is desirable here.
  const totalSupplyFormatted = formatNumberOrString({
    value: tokenTotalSupply.toExact(),
    type: NumberType.TokenQuantityStats,
    placeholder: '0',
  })

  const handleRawChange = useCallback(
    (raw: string) => {
      if (!isAllowedCompactNumberInput(raw)) {
        return
      }
      if (inputExceedsCurrencyPrecision(raw, currency.decimals)) {
        return
      }
      setRawInput(raw)
      const parsed = parseSuffixedAmount(raw, currency)
      if (!parsed) {
        return
      }
      // Live-update with exact amount; cap to the deposit ceiling so the store stays valid
      const capped = parsed.greaterThan(maxAuctionSupplyAmount) ? maxAuctionSupplyAmount : parsed
      onAmountChange(capped)
    },
    [currency, maxAuctionSupplyAmount, onAmountChange],
  )

  const {
    displayValue: focusedDisplay,
    inputRef,
    handleChange,
  } = useLocalizedNumberInput({
    rawValue: rawInput,
    locale,
    onChangeRaw: handleRawChange,
  })

  // While focused, parse typed value into a CurrencyAmount for exact comparison
  const parsedAmount = useMemo(
    () => (isFocused ? parseSuffixedAmount(rawInput, currency) : null),
    [isFocused, rawInput, currency],
  )
  const exceedsMax = parsedAmount !== null && parsedAmount.greaterThan(maxAuctionSupplyAmount)

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // Seed the input with the current raw numeric value (unformatted)
    const exactValue = auctionSupplyAmount.toExact()
    setRawInput(exactValue === '0' ? '' : exactValue)
  }, [auctionSupplyAmount])

  const handleBlur = useCallback(() => {
    setIsFocused(false)

    const parsed = parseSuffixedAmount(rawInput, currency)
    if (!parsed) {
      return
    }

    // Clamp into [min, max] on blur: the lower bound keeps the sold/LP split from rounding a leg to
    // zero base units (a degenerate auction that divides by zero in the percent math); the upper
    // bound is the deposit ceiling (full supply for a new token, wallet balance for an existing one).
    // Raise to the min first, then cap at the ceiling, so the ceiling always wins — in the
    // pathological case where min > max (a token with fewer base units than the minimum two-leg
    // deposit, or a wallet holding too little) the result never exceeds the ceiling, and the step's
    // own validation disables Continue since the deposit stays below the minimum.
    const raised = parsed.lessThan(minAuctionSupplyAmount) ? minAuctionSupplyAmount : parsed
    const clamped = raised.greaterThan(maxAuctionSupplyAmount) ? maxAuctionSupplyAmount : raised
    onAmountChange(clamped)
  }, [rawInput, currency, maxAuctionSupplyAmount, minAuctionSupplyAmount, onAmountChange])

  const trace = useTrace()
  const handleSelectPercent = useCallback(
    (percent: number) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { ...trace, element: ElementName.AuctionSupplyPreset })
      setIsFocused(false)
      setRawInput('')
      onSelectPercent(percent)
    },
    [onSelectPercent, trace],
  )

  const media = useMedia()
  // stack pills on medium-and-smaller viewports.
  const stackPresetPills = Boolean(media.md)

  return (
    <Flex
      backgroundColor="$surface2"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded16"
      p="$spacing16"
      gap="$spacing8"
    >
      <Text variant="buttonLabel3" color="$neutral2">
        {t('toucan.createAuction.step.configureAuction.depositAmount')}
      </Text>

      {/* Input Row: amount (left) + preset pills (right), vertically centered — stacks when narrow */}
      <Flex
        row={!stackPresetPills}
        alignItems={stackPresetPills ? 'stretch' : 'center'}
        justifyContent="space-between"
        gap="$spacing8"
        width="100%"
      >
        <Flex row alignItems="center" gap="$spacing4" flex={1} minWidth={0} overflow="hidden">
          {isFocused ? (
            <Trace logFocus element={ElementName.AuctionSupplyAmount}>
              <Input
                ref={inputRef}
                autoFocus
                unstyled
                outlineStyle="none"
                minWidth={0}
                flexShrink={1}
                $platform-web={{
                  fieldSizing: 'content',
                  maxWidth: '100%',
                }}
                value={focusedDisplay}
                onChangeText={handleChange}
                onBlur={handleBlur}
                placeholder="0"
                placeholderTextColor="$neutral3"
                fontFamily="$heading"
                fontSize={fonts.heading3.fontSize}
                lineHeight={fonts.heading3.lineHeight}
                fontWeight={fonts.heading3.fontWeight}
                color={exceedsMax ? '$statusCritical' : '$neutral1'}
                backgroundColor="$transparent"
              />
            </Trace>
          ) : (
            <Text variant="heading3" color="$neutral1" cursor="text" onPress={handleFocus}>
              {displayUnfocused}
            </Text>
          )}
          <Text flexShrink={0} variant="heading3" color="$neutral3">
            {truncateSymbol(tokenSymbol)}
          </Text>
        </Flex>

        <Flex
          gap="$spacing2"
          maxWidth="100%"
          alignSelf={stackPresetPills ? 'stretch' : 'center'}
          width={stackPresetPills ? '100%' : undefined}
          flexShrink={0}
          $platform-web={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            ...(!stackPresetPills ? { width: 'min(100%, 20rem)' } : {}),
          }}
        >
          {QUICK_SELECT_PERCENTS.map((pillPercent) => (
            <PercentButton
              key={pillPercent}
              label={`${pillPercent}%`}
              isActive={auctionSupplyAmount.equalTo(percentOfAmount(maxAuctionSupplyAmount, pillPercent))}
              onPress={handleSelectPercent.bind(null, pillPercent)}
            />
          ))}
          <PercentButton
            label={t('common.max')}
            isActive={auctionSupplyAmount.equalTo(maxAuctionSupplyAmount)}
            onPress={handleSelectPercent.bind(null, 100)}
          />
        </Flex>
      </Flex>

      {/* Total supply reference line — existing tokens only; new tokens have a dedicated input above */}
      {showTotalSupply ? (
        <Text variant="body4" color="$neutral2">
          {t('toucan.auction.totalSupply')}: {totalSupplyFormatted} {tokenSymbol}
        </Text>
      ) : null}
    </Flex>
  )
}
