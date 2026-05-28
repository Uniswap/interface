import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, Text } from 'ui/src'
import { Caret } from 'ui/src/components/icons/Caret'
import { getValueSignInfo } from 'uniswap/src/components/ProfitLoss/constants'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

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
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currency = useAppFiatCurrencyInfo()

  const { hasReasonableValue, isPositive, arrowColor } = getValueSignInfo(value)

  const formattedValue = hasReasonableValue
    ? formatNumberOrString({
        value: Math.abs(value ?? 0),
        type: NumberType.PortfolioBalance,
        currencyCode: currency.code,
      })
    : undefined

  const formattedPercent = hasReasonableValue && percent !== undefined ? formatPercent(Math.abs(percent)) : undefined

  return (
    <Flex row justifyContent="space-between" alignItems="center" pointerEvents="none">
      <Text variant="body3" color={labelColor}>
        {label}
      </Text>
      {isLoading ? (
        <Text loading variant="body3" loadingPlaceholderText="0000.00 (0.00%)" />
      ) : formattedValue !== undefined ? (
        <Flex row alignItems="center" gap="$spacing4">
          {showArrow && arrowColor && <Caret color={arrowColor} direction={isPositive ? 'n' : 's'} size="$icon.16" />}
          <Text variant="body3" color="$neutral1">
            {formattedValue}
          </Text>
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
