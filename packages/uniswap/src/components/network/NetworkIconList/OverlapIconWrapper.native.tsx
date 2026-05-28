import MaskedView from '@react-native-masked-view/masked-view'
import { useMemo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { Flex } from 'ui/src'
import type { OverlapIconWrapperProps } from 'uniswap/src/components/network/NetworkIconList/OverlapIconWrapper'

/** Rounded rect SVG path (squircle). Two paths with evenodd fill create a punch-out mask. */
function roundedRectPath(rect: { x: number; y: number; width: number; height: number; radius: number }): string {
  const { x, y, width: w, height: h, radius: r } = rect
  return `M ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} L ${x + r} ${y + h} Q ${x} ${y + h} ${x} ${y + h - r} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} Z`
}

/**
 * Native: uses MaskedView with an SVG evenodd mask (squircle minus overlapping squircle)
 * so the icon is visible only where it doesn't overlap the previous icon.
 *
 * Note: MaskedView uses a software rendering layer on Android, which is fine for a small
 * number of icons but could cause jank if rendered in bulk (e.g. many rows in a FlatList).
 */
export function OverlapIconWrapper({
  children,
  outerSize,
  overlapPx,
  clipBorderRadius,
}: OverlapIconWrapperProps): JSX.Element {
  const maskElement = useMemo(() => {
    const outerPath = roundedRectPath({ x: 0, y: 0, width: outerSize, height: outerSize, radius: clipBorderRadius })
    const holePath = roundedRectPath({
      x: overlapPx - outerSize,
      y: 0,
      width: outerSize,
      height: outerSize,
      radius: clipBorderRadius,
    })

    return (
      <Flex backgroundColor="$transparent" width={outerSize} height={outerSize}>
        <Svg width={outerSize} height={outerSize} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          <Path d={`${outerPath} ${holePath}`} fill="white" fillRule="evenodd" />
        </Svg>
      </Flex>
    )
  }, [outerSize, overlapPx, clipBorderRadius])

  return (
    <MaskedView maskElement={maskElement} style={{ width: outerSize, height: outerSize }}>
      {children}
    </MaskedView>
  )
}
