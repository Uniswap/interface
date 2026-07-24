import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, Text } from 'ui/src'
import { Caret } from 'ui/src/components/icons/Caret'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { getValueSignInfo } from 'uniswap/src/components/ProfitLoss/constants'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { usePrevious } from 'utilities/src/react/hooks'

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
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  const { t } = useTranslation()
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currency = useAppFiatCurrencyInfo()

  // Track last known values so AnimatedNumber handles transitions instead of reverting to a skeleton.
  // The skeleton only shows on the initial load when no previous value exists.
  const previousValue = usePrevious(value)
  const previousPercent = usePrevious(percent)

  const displayValue = isLoading ? previousValue : value
  const displayPercent = isLoading ? previousPercent : percent

  const { hasReasonableValue, isPositive, arrowColor } = getValueSignInfo(displayValue)

  const formattedValue = hasReasonableValue
    ? formatNumberOrString({
        value: Math.abs(displayValue ?? 0),
        type: NumberType.PortfolioBalance,
        currencyCode: currency.code,
      })
    : undefined

  const formattedPercent =
    hasReasonableValue && displayPercent !== undefined ? formatPercent(Math.abs(displayPercent)) : undefined

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
          <AnimatedNumber
            numericValue={displayValue}
            value={formattedValue}
            textVariant="$body3"
            disableAnimations={!isDataLivelinessEnabled}
          />
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
