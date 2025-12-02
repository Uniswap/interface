import { ValueWithFadedDecimals } from 'pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
import { EmptyTableCell } from 'pages/Portfolio/EmptyTableCell'
import { TokenData } from 'pages/Portfolio/Tokens/hooks/useTransformTokenTableData'
import { memo, useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export const Value = memo(function Value({ value }: { value: TokenData['value'] }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const formattedValue = useMemo(() => {
    return convertFiatAmountFormatted(value, NumberType.PortfolioBalance)
  }, [value, convertFiatAmountFormatted])

  if (!value && value !== 0) {
    return <EmptyTableCell />
  }

  return <ValueWithFadedDecimals value={formattedValue} />
})
Value.displayName = 'Value'
