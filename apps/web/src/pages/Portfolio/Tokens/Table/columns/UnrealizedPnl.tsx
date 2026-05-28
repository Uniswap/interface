import { memo, useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { Caret } from 'ui/src/components/icons/Caret'
import { getValueSignInfo } from 'uniswap/src/components/ProfitLoss/constants'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'

interface UnrealizedPnlProps {
  value: number | undefined
  percent: number | undefined
  isStablecoin?: boolean
  showPercent?: boolean
}

export const UnrealizedPnl = memo(function UnrealizedPnl({
  value,
  percent,
  isStablecoin,
  showPercent = false,
}: UnrealizedPnlProps) {
  const { formatNumberOrString, formatPercent } = useLocalizationContext()
  const currency = useAppFiatCurrencyInfo()

  const { hasReasonableValue, isPositive, arrowColor } = getValueSignInfo(value)

  const formattedValue = useMemo(() => {
    if (isStablecoin) {
      return formatNumberOrString({
        value: 0,
        type: NumberType.PortfolioBalance,
        currencyCode: currency.code,
      })
    }
    if (!hasReasonableValue) {
      return undefined
    }
    // 0.005 is the smallest absolute value that rounds up to 0.01 at 2 decimal
    // places. Anything below it rounds to 0.00 — but Intl.NumberFormat preserves
    // the sign, producing "-0.00" for tiny negatives. Coerce to zero instead.
    const NEGATIVE_ZERO_THRESHOLD = 0.005
    const safeValue = value ?? 0
    const displayValue = Math.abs(safeValue) < NEGATIVE_ZERO_THRESHOLD ? 0 : safeValue
    return formatNumberOrString({
      value: displayValue,
      type: NumberType.PortfolioBalance,
      currencyCode: currency.code,
    })
  }, [isStablecoin, hasReasonableValue, value, formatNumberOrString, currency.code])

  const formattedPercent = useMemo(() => {
    if (!showPercent) {
      return undefined
    }
    if (isStablecoin) {
      return formatPercent(0)
    }
    if (!hasReasonableValue || percent === undefined) {
      return undefined
    }
    return formatPercent(Math.abs(percent))
  }, [showPercent, isStablecoin, hasReasonableValue, percent, formatPercent])

  if (!isStablecoin && !hasReasonableValue) {
    return <EmptyTableCell />
  }

  return (
    <Flex alignItems="flex-end">
      <Text variant="body3">{formattedValue}</Text>
      {formattedPercent && (
        <Flex row alignItems="center" gap="$spacing4">
          {isStablecoin ? (
            <Caret color="$neutral2" direction="n" size="$icon.16" />
          ) : (
            arrowColor && <Caret color={arrowColor} direction={isPositive ? 'n' : 's'} size="$icon.16" />
          )}
          <Text variant="body3" color="$neutral2">
            {formattedPercent}
          </Text>
        </Flex>
      )}
    </Flex>
  )
})
UnrealizedPnl.displayName = 'UnrealizedPnl'
