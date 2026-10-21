import { ColorTokens, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { Caret } from 'ui/src/components/icons/Caret'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { getValueSignInfo } from 'uniswap/src/components/ProfitLoss/constants'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { formatNumberWithSubscript } from 'utilities/src/format/subscriptNotation'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'

// PortfolioBalance rounds to two decimals, so sub-cent average costs read as $0.00. Subscript
// notation is safe inside AnimatedNumber: it only rolls ASCII digits, so ₄ renders as plain text.
const SUBSCRIPT_FIAT_THRESHOLD = 0.01

// Below this, a return is float noise (e.g. residual on a zero balance), not a real amount.
const DUST_THRESHOLD = 0.000001

interface ProfitLossRowProps {
  label: string
  value?: number
  percent?: number
  showArrow?: boolean
  isLoading?: boolean
  labelColor?: ColorTokens
}

export function ProfitLossRow({
  label,
  value,
  percent,
  showArrow,
  isLoading,
  labelColor = '$neutral1',
}: ProfitLossRowProps): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent, addFiatSymbolToNumber } = useLocalizationContext()
  const locale = useCurrentLocale()
  const currency = useAppFiatCurrencyInfo()

  // Track last known values so AnimatedNumber handles transitions instead of reverting to a skeleton.
  // The skeleton only shows on the initial load when no previous value exists.
  const previousValue = usePrevious(value)
  const previousPercent = usePrevious(percent)

  const rawDisplayValue = isLoading ? previousValue : value
  const displayPercent = isLoading ? previousPercent : percent

  // Snap to zero (real-zero path). showArrow-only: sub-dust average costs are real.
  const isDust =
    showArrow &&
    rawDisplayValue !== undefined &&
    Math.abs(rawDisplayValue) > 0 &&
    Math.abs(rawDisplayValue) < DUST_THRESHOLD
  const displayValue = isDust ? 0 : rawDisplayValue

  const { hasReasonableValue, isPositive, arrowColor } = getValueSignInfo(displayValue)

  const absValue = Math.abs(displayValue ?? 0)
  const useSubscript = absValue > 0 && absValue < SUBSCRIPT_FIAT_THRESHOLD

  const formattedValue = !hasReasonableValue
    ? undefined
    : useSubscript
      ? addFiatSymbolToNumber({
          value: formatNumberWithSubscript({ value: absValue, locale }),
          currencyCode: currency.code,
          currencySymbol: currency.symbol,
        })
      : formatNumberOrString({
          value: absValue,
          type: NumberType.PortfolioBalance,
          currencyCode: currency.code,
        })

  const formattedPercent =
    hasReasonableValue && !isDust && displayPercent !== undefined ? formatPercent(Math.abs(displayPercent)) : undefined

  return (
    <Flex row justifyContent="space-between" alignItems="center" pointerEvents="none">
      <Text variant="body3" color={labelColor}>
        {label}
      </Text>
      {isLoading && displayValue === undefined ? (
        <Text loading variant="body3" loadingPlaceholderText="0000.00 (0.00%)" />
      ) : formattedValue !== undefined ? (
        <Flex row shrink alignItems="center" gap="$spacing4">
          {showArrow && arrowColor && <Caret color={arrowColor} direction={isPositive ? 'n' : 's'} size="$icon.16" />}
          <AnimatedNumber numericValue={displayValue} value={formattedValue} textVariant="$body3" />
          {formattedPercent && (
            <Text variant="body3" color="$neutral2">
              ({formattedPercent})
            </Text>
          )}
        </Flex>
      ) : (
        <Text variant="body3" color="$neutral3">
          {t('common.unavailable')}
        </Text>
      )}
    </Flex>
  )
}
