import { memo, useMemo } from 'react'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'
import { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export const Value = memo(function Value({ value }: { value: TokenData['totalValue'] }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const formattedValue = useMemo(() => {
    return convertFiatAmountFormatted(value, NumberType.PortfolioBalance)
  }, [value, convertFiatAmountFormatted])

  if (!value && value !== 0) {
    return <EmptyTableCell />
  }

  return (
    <AnimatedNumber shouldFadeDecimals value={formattedValue} numericValue={value} textVariant="$body3" alignRight />
  )
})
Value.displayName = 'Value'
