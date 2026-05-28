import { memo, useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ValueWithFadedDecimals } from '~/pages/Portfolio/components/ValueWithFadedDecimals/ValueWithFadedDecimals'
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

  return <ValueWithFadedDecimals value={formattedValue} />
})
AvgCost.displayName = 'AvgCost'
