import { Percent } from '@uniswap/sdk-core'
import { Flex, Text } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { scaleLinear } from 'd3'
import { useMemo } from 'react'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useSrcColor } from '~/hooks/useColor'

type Bar = {
  /**
   * Identity of the segment, stable across refetches — it keys the slice's extracted-color state.
   * The token alone won't do: a pool incentivized in one of its own tokens has a fee segment and a
   * reward segment in the same currency, so callers qualify it with the segment's role.
   */
  id: string
  value: Percent
  currencyInfo: CurrencyInfo
}

type LiquidityPositionStackedBarsProps = {
  bars: Bar[]
}

/**
 * A bar's slice is tinted with its token's logo colour. Extracting it here rather than in the
 * caller keeps it one hook per rendered slice, so the number of bars can vary freely — callers
 * pass however many they have and don't deal in colour at all.
 */
function BarSlice({ currencyInfo, share }: { currencyInfo: CurrencyInfo; share: number }) {
  const colors = useSporeColors()
  // Contrast is checked against surface2 — every surface these bars appear on is a surface2 card.
  const { tokenColor } = useSrcColor({
    src: currencyInfo.logoUrl ?? undefined,
    currencyName: currencyInfo.currency.name,
    backgroundColor: colors.surface2.val,
  })

  return (
    <Flex
      height={4}
      borderRadius="$roundedFull"
      backgroundColor={tokenColor ?? colors.accent1.val}
      // Grown from zero rather than sized as a percentage: shares already total 100%, so the gaps
      // between slices would otherwise add to that and push the row past its container. Growing
      // takes the gaps out of the available width instead, however many slices there are.
      flexGrow={share}
      flexBasis={0}
      minWidth={0}
    />
  )
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
        {bars.map((bar) => (
          <BarSlice key={bar.id} currencyInfo={bar.currencyInfo} share={scale(safePercentToNumber(bar.value))} />
        ))}
      </Flex>
      {/* Wraps because the entry count follows the number of reward tokens, which is open-ended —
          five already outgrow the card on one line. */}
      <Flex row flexWrap="wrap" gap="$gap12" rowGap="$spacing8">
        {bars.map((bar) => (
          <Flex row alignItems="center" gap="$spacing6" key={bar.id} testID={TestID.LiquidityPositionStackedBarSegment}>
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
