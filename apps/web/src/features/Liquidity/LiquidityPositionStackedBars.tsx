import { Percent } from '@uniswap/sdk-core'
import { scaleLinear } from 'd3'
import { useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

type Bar = {
  value: Percent
  color: string
  currencyInfo: CurrencyInfo
}

type LiquidityPositionStackedBarsProps = {
  bars: Bar[]
}

export const LiquidityPositionStackedBars = ({ bars }: LiquidityPositionStackedBarsProps) => {
  const { formatPercent } = useLocalizationContext()
  const scale = useMemo(() => {
    const sum = bars.reduce((acc, bar) => acc.add(bar.value), new Percent(0, 100))
    // Check if sum is effectively zero to avoid division by zero
    const sumValue = sum.equalTo(new Percent(0, 100)) ? 1 : Number(sum.toFixed(2))
    return scaleLinear().domain([0, sumValue]).range([0, 100])
  }, [bars])

  // Helper function to safely convert Percent to number
  const safePercentToNumber = (percent: Percent): number => {
    return percent.equalTo(new Percent(0, 100)) ? 0 : Number(percent.toFixed(2))
  }

  return (
    <Flex gap="$gap8">
      <Flex row borderRadius="$roundedFull" gap="$spacing2" height={4}>
        {bars.map((bar, i) => (
          <Flex
            key={i}
            height={4}
            borderRadius="$roundedFull"
            backgroundColor={bar.color}
            width={`${scale(safePercentToNumber(bar.value))}%`}
          />
        ))}
      </Flex>
      <Flex row gap="$gap12">
        {bars.map((bar, i) => (
          <Flex row alignItems="center" gap="$spacing6" key={i}>
            <CurrencyLogo currencyInfo={bar.currencyInfo} size={16} />
            <Text variant="body3" color="$neutral1">
              {bar.value.equalTo(new Percent(0, 100)) ? '0%' : formatPercent(scale(safePercentToNumber(bar.value)))}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
