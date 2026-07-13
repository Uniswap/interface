import { GraphQLApi } from '@universe/api'
import { ReactNode } from 'react'
import { Flex } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { isLowVarianceRange } from 'uniswap/src/components/charts/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { PriceChartData } from '~/components/Charts/PriceChart/index'
import { PriceChartBody } from '~/components/Charts/PriceChart/PriceChartBody'
import { PriceChartDelta } from '~/components/Charts/PriceChart/PriceChartDelta'
import { getCandlestickPriceBounds } from '~/components/Charts/PriceChart/utils'
import { PriceChartType } from '~/components/Charts/utils'

interface PriceChartProps {
  type: PriceChartType
  height: number
  data: PriceChartData[]
  stale: boolean
  timePeriod?: GraphQLApi.HistoryDuration
  pricePercentChange?: number
  overrideColor?: string
  headerTotalValueOverride?: number
  hideYAxis?: boolean
  hidePercentDelta?: boolean
  yAxisFormatter?: (price: number) => string
  /** Additional content rendered next to the price delta in the chart header.
   *  Can be a ReactNode or a render function receiving { isHovering }. */
  additionalHeaderContent?: ReactNode | (({ isHovering }: { isHovering: boolean }) => ReactNode)
}

export function PriceChart({
  data,
  height,
  type,
  stale,
  timePeriod,
  pricePercentChange,
  overrideColor,
  headerTotalValueOverride,
  hideYAxis,
  yAxisFormatter,
  additionalHeaderContent,
  hidePercentDelta,
}: PriceChartProps) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const startingPrice = data[0]
  const lastPrice = data[data.length - 1]
  const { min, max } = getCandlestickPriceBounds(data)
  const shouldTreatAsStablecoin = isLowVarianceRange({
    min,
    max,
    duration: timePeriod,
  })
  return (
    <PriceChartBody
      data={data}
      height={height}
      type={type}
      stale={stale}
      timePeriod={timePeriod}
      overrideColor={overrideColor}
      hideYAxis={hideYAxis}
      yAxisFormatter={yAxisFormatter}
    >
      {(crosshairData) => {
        const headerValue = crosshairData ? crosshairData.value : (headerTotalValueOverride ?? lastPrice.value)
        const isHovering = !!crosshairData

        return (
          <ChartHeader
            value={
              <AnimatedNumber
                value={convertFiatAmountFormatted(headerValue, NumberType.FiatTokenPrice)}
                numericValue={headerValue}
                textVariant="$heading2"
                disableAnimations={isHovering}
              />
            }
            additionalFields={
              <Flex row gap="$gap8" alignItems="center">
                <PriceChartDelta
                  startingPrice={startingPrice.close}
                  endingPrice={(crosshairData ?? lastPrice).close}
                  shouldIncludeFiatDelta
                  shouldTreatAsStablecoin={shouldTreatAsStablecoin}
                  pricePercentChange={pricePercentChange}
                  isHovering={isHovering}
                  hidePercent={hidePercentDelta}
                />
                {typeof additionalHeaderContent === 'function'
                  ? additionalHeaderContent({ isHovering })
                  : additionalHeaderContent}
              </Flex>
            }
            time={crosshairData?.time}
          />
        )
      }}
    </PriceChartBody>
  )
}
