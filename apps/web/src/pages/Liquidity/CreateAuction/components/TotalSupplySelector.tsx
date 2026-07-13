import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Input, Text, Tooltip, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { PercentButton } from '~/pages/Liquidity/CreateAuction/components/PercentButton'
import {
  NEW_TOKEN_MAX_TOTAL_SUPPLY,
  NEW_TOKEN_MIN_TOTAL_SUPPLY,
  NEW_TOKEN_TOTAL_SUPPLY_PRESETS,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  expandCompactNumberInput,
  formatCompactNumberDisplay,
  inputExceedsCurrencyPrecision,
  isAllowedCompactNumberInput,
  truncateSymbol,
} from '~/pages/Liquidity/CreateAuction/utils'
import { useLocalizedNumberInput } from '~/pages/Liquidity/CreateAuction/utils/localizedNumberInput'

/** Parses a suffixed input string ("1b", "10m") into a CurrencyAmount with exact precision. */
function parseSuffixedAmount(input: string, currency: Currency): CurrencyAmount<Currency> | null {
  const expanded = expandCompactNumberInput(input)
  if (!expanded) {
    return null
  }
  return tryParseCurrencyAmount(expanded, currency) ?? null
}

/** Clamps an amount into [min, max], skipping either bound when it failed to parse. */
function clampToRange(
  amount: CurrencyAmount<Currency>,
  { min, max }: { min: CurrencyAmount<Currency> | undefined; max: CurrencyAmount<Currency> | undefined },
): CurrencyAmount<Currency> {
  const raised = min && amount.lessThan(min) ? min : amount
  return max && raised.greaterThan(max) ? max : raised
}

interface TotalSupplySelectorProps {
  /** The new token's total supply. Editable; bounded to [1M, 100B] whole tokens (LP-960). */
  totalSupply: CurrencyAmount<Currency>
  tokenSymbol: string
  onChange: (totalSupply: CurrencyAmount<Currency>) => void
}

export function TotalSupplySelector({ totalSupply, tokenSymbol, onChange }: TotalSupplySelectorProps) {
  const { t } = useTranslation()
  const locale = useCurrentLocale()

  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState('')

  const currency = totalSupply.currency

  const minAmount = useMemo(() => tryParseCurrencyAmount(String(NEW_TOKEN_MIN_TOTAL_SUPPLY), currency), [currency])
  const maxAmount = useMemo(() => tryParseCurrencyAmount(String(NEW_TOKEN_MAX_TOTAL_SUPPLY), currency), [currency])
  const presets = useMemo(
    () =>
      NEW_TOKEN_TOTAL_SUPPLY_PRESETS.flatMap((value) => {
        const amount = tryParseCurrencyAmount(String(value), currency)
        return amount ? [{ value, amount }] : []
      }),
    [currency],
  )

  const handleRawChange = useCallback(
    (raw: string) => {
      if (!isAllowedCompactNumberInput(raw) || inputExceedsCurrencyPrecision(raw, currency.decimals)) {
        return
      }
      setRawInput(raw)
      const parsed = parseSuffixedAmount(raw, currency)
      if (!parsed) {
        return
      }
      // Live-update the committed value, but keep it within [min, max] so consumers (FDV, supply
      // breakdown, review preview) never rebuild against an out-of-range supply while typing. The
      // typed text is preserved (display is separate); the red out-of-range state still flags sub-min.
      onChange(clampToRange(parsed, { min: minAmount, max: maxAmount }))
    },
    [currency, minAmount, maxAmount, onChange],
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

  const parsedAmount = useMemo(
    () => (isFocused ? parseSuffixedAmount(rawInput, currency) : null),
    [isFocused, rawInput, currency],
  )
  const belowMin = parsedAmount !== null && !!minAmount && parsedAmount.lessThan(minAmount)
  const aboveMax = parsedAmount !== null && !!maxAmount && parsedAmount.greaterThan(maxAmount)
  const isOutOfRange = belowMin || aboveMax

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    // Seed the input with the current raw numeric value (unformatted).
    const exactValue = totalSupply.toExact()
    setRawInput(exactValue === '0' ? '' : exactValue)
  }, [totalSupply])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    const parsed = parseSuffixedAmount(rawInput, currency)
    if (!parsed) {
      return
    }
    // Clamp into [min, max] on blur (raise to min, then cap at max).
    onChange(clampToRange(parsed, { min: minAmount, max: maxAmount }))
  }, [rawInput, currency, minAmount, maxAmount, onChange])

  const handleSelectPreset = useCallback(
    (amount: CurrencyAmount<Currency>) => {
      setIsFocused(false)
      setRawInput('')
      onChange(amount)
    },
    [onChange],
  )

  const media = useMedia()
  // Stack pills on medium-and-smaller viewports.
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
        {t('toucan.auction.totalSupply')}
      </Text>

      <Flex
        row={!stackPresetPills}
        alignItems={stackPresetPills ? 'stretch' : 'center'}
        justifyContent={stackPresetPills ? 'flex-start' : 'space-between'}
        gap="$spacing8"
        width="100%"
      >
        {/* Amount input + symbol; an out-of-range value surfaces a tooltip below the input */}
        <Tooltip placement="bottom" open={isOutOfRange}>
          <Tooltip.Trigger asChild>
            <Flex row alignItems="center" gap="$spacing4" flex={1} minWidth={0} overflow="hidden">
              {isFocused ? (
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
                  color={isOutOfRange ? '$statusCritical' : '$neutral1'}
                  backgroundColor="$transparent"
                />
              ) : (
                <Text variant="heading3" color="$neutral1" cursor="text" onPress={handleFocus}>
                  {formatCompactNumberDisplay(Number(totalSupply.toExact()))}
                </Text>
              )}
              <Text flexShrink={0} variant="heading3" color="$neutral3">
                {truncateSymbol(tokenSymbol)}
              </Text>
            </Flex>
          </Tooltip.Trigger>
          <Tooltip.Content animationDirection="bottom">
            <Tooltip.Arrow />
            <Text variant="body4" color="$neutral1">
              {belowMin
                ? t('toucan.createAuction.step.configureAuction.totalSupply.minError', {
                    min: formatCompactNumberDisplay(NEW_TOKEN_MIN_TOTAL_SUPPLY),
                  })
                : t('toucan.createAuction.step.configureAuction.totalSupply.maxError', {
                    max: formatCompactNumberDisplay(NEW_TOKEN_MAX_TOTAL_SUPPLY),
                  })}
            </Text>
          </Tooltip.Content>
        </Tooltip>

        {/* Preset pills: same row when wide, stacked when narrow */}
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
          {presets.map((preset) => (
            <PercentButton
              key={preset.value}
              label={formatCompactNumberDisplay(preset.value)}
              isActive={totalSupply.equalTo(preset.amount)}
              onPress={handleSelectPreset.bind(null, preset.amount)}
            />
          ))}
        </Flex>
      </Flex>
    </Flex>
  )
}
