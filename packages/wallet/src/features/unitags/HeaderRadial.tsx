import { memo } from 'react'
import Svg, { ClipPath, Defs, RadialGradient, Rect, Stop } from 'react-native-svg'

const HEADER_SOLID_COLOR_OPACITY = 0.1

export const solidHeaderProps = {
  minOpacity: HEADER_SOLID_COLOR_OPACITY,
  maxOpacity: HEADER_SOLID_COLOR_OPACITY,
}

export const HeaderRadial = memo(function HeaderRadial({
  color,
  borderRadius,
  minOpacity,
  maxOpacity,
}: {
  color: string
  borderRadius?: number
  minOpacity?: number
  maxOpacity?: number
}): JSX.Element {
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <ClipPath id="clip">
          <Rect height="100%" rx={borderRadius} width="100%" />
        </ClipPath>
        <RadialGradient cy="-0.1" id="background" rx="0.8" ry="1.1">
          <Stop offset="0" stopColor={color} stopOpacity={maxOpacity ?? '0.6'} />
          <Stop offset="1" stopColor={color} stopOpacity={minOpacity ?? '0'} />
        </RadialGradient>
      </Defs>
      <Rect
        clipPath={borderRadius ? 'url(#clip)' : undefined}
        fill="url(#background)"
        height="100%"
        width="100%"
        x="0"
        y="0"
      />
    </Svg>
  )
})
