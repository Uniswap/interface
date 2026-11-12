import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { memo, useId, useMemo } from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { type ChartPoint, computeChartPaths } from 'uniswap/src/components/charts/computeChartPaths'
import { getIsStablecoin } from 'uniswap/src/components/charts/utils'

const STROKE_WIDTH = 1.5
const Y_GUTTER = 2
const GRADIENT_TOP_OPACITY = 0.16

export const TokenCardSparkline = memo(function TokenCardSparkline({
  data,
  width,
  height,
  isNegative,
  categoryIds,
}: {
  data: ChartPoint[]
  width: number
  height: number
  isNegative: boolean
  categoryIds?: readonly string[]
}): JSX.Element {
  const colors = useSporeColors()
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()
  const isStablecoin = getIsStablecoin({ tokenCategoriesEnabled, categoryIds }) === true
  const id = useId()
  // useId can emit colons, which are invalid inside SVG url() references
  const gradientId = useMemo(() => `token-card-sparkline-${id.replace(/:/g, '')}`, [id])

  const { linePath, areaPath } = useMemo(
    () => computeChartPaths({ data, dataWidth: width, height, yGutter: Y_GUTTER, isStablecoin }),
    [data, width, height, isStablecoin],
  )

  if (!linePath) {
    return <Flex height={height} testID="token-card-sparkline-empty" width={width} />
  }

  const color = isNegative ? colors.statusCritical.val : colors.statusSuccess.val

  return (
    <Svg height={height} width={width}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={GRADIENT_TOP_OPACITY} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {areaPath ? <Path d={areaPath} fill={`url(#${gradientId})`} /> : null}
      <Path
        d={linePath}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={STROKE_WIDTH}
      />
    </Svg>
  )
})
