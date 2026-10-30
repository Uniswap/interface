import { useExtractedTokenColor } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { SparklineChart } from 'src/components/charts/SparklineChart'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { useTokenPriceHistory } from 'src/components/PriceExplorer/usePriceHistory'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'

// Used to divide the number of data points for a smoother charts
// Necessary because graphql query does not support a time resolution parameter
const DATA_REDUCTION_FACTOR = 10

const Y_GUTTER = 2

export function TokenItemChart({
  tokenItemData,
  height,
  width,
}: {
  tokenItemData: TokenItemData
  height: number
  width: number
}): JSX.Element | null {
  const { convertFiatAmount } = useLocalizationContext()
  const conversionRate = convertFiatAmount(1).amount
  const colors = useSporeColors()

  const currencyId = tokenItemData.address
    ? buildCurrencyId(tokenItemData.chainId, tokenItemData.address)
    : buildNativeCurrencyId(tokenItemData.chainId)
  const { data } = useTokenPriceHistory({ currencyId })
  const { tokenColor } = useExtractedTokenColor({
    imageUrl: tokenItemData.logoUrl,
    tokenName: tokenItemData.symbol,
    backgroundColor: colors.surface1.val,
    defaultColor: colors.neutral3.val,
    colorOverrides: tokenItemData.colorOverrides,
  })

  const convertedPriceHistory = useMemo(
    () =>
      data?.priceHistory
        ?.filter((_, index) => index % DATA_REDUCTION_FACTOR === 0)
        .map((point) => {
          return { ...point, value: point.value * conversionRate }
        }),
    [data, conversionRate],
  )

  if (!convertedPriceHistory || !convertedPriceHistory.length) {
    return null
  }

  return (
    <SparklineChart
      data={convertedPriceHistory}
      width={width}
      height={height}
      color={tokenColor ?? colors.neutral2.val}
      yGutter={Y_GUTTER}
    />
  )
}
