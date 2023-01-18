import React, { memo } from 'react'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { Theme } from 'src/styles/theme'

function _UniconThemedRadial({
  gradientStartColor,
  gradientEndColor,
  borderRadius,
  opacity = 0.25,
}: {
  gradientStartColor: string
  gradientEndColor: string
  borderRadius: keyof Theme['borderRadii']
  opacity?: number
}): JSX.Element {
  const theme = useAppTheme()

  return (
    <Svg height="100%" width="100%">
      <Defs>
        <RadialGradient cy="-0.1" id="background" rx="4" ry="1">
          <Stop offset="0" stopColor={gradientStartColor} stopOpacity="1" />
          <Stop offset="1" stopColor={gradientEndColor} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect
        fill="url(#background)"
        height="100%"
        opacity={opacity}
        rx={theme.borderRadii[borderRadius]}
        width="100%"
        x="0"
        y="0"
      />
    </Svg>
  )
}

export const UniconThemedRadial = memo(_UniconThemedRadial)
