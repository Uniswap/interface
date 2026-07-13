import { memo, useMemo } from 'react'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'

export const AvgCost = memo(function AvgCost({ value }: { value: number | undefined }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const formattedValue = useMemo(() => {
    if (value === undefined) {
      return undefined
    }
    return convertFiatAmountFormatted(value, NumberType.FiatTokenPrice)
  }, [value, convertFiatAmountFormatted])

  if (formattedValue === undefined) {
    return <EmptyTableCell />
  }

  return (
    <AnimatedNumber shouldFadeDecimals value={formattedValue} numericValue={value} textVariant="$body3" alignRight />
  )
})
AvgCost.displayName = 'AvgCost'
