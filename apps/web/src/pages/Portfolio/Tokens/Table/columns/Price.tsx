import { memo, useMemo } from 'react'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { EmptyTableCell } from '~/pages/Portfolio/EmptyTableCell'
import type { TokenData } from '~/pages/Portfolio/Tokens/hooks/useTransformTokenTableData'

export const Price = memo(function Price({ price }: { price: TokenData['price'] }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const formattedPrice = useMemo(() => {
    return convertFiatAmountFormatted(price, NumberType.FiatTokenPrice)
  }, [price, convertFiatAmountFormatted])

  if (!price && price !== 0) {
    return <EmptyTableCell />
  }

  return (
    <AnimatedNumber shouldFadeDecimals value={formattedPrice} numericValue={price} textVariant="$body3" alignRight />
  )
})
Price.displayName = 'Price'
