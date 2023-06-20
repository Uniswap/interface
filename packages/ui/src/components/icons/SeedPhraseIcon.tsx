import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon: React.FC<IconProps> = (props) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = isWeb ? 'currentColor' : undefined,
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const theme = useTheme()

  const size = typeof sizeProp === 'string' ? getTokenValue(sizeProp, 'size') : sizeProp

  const strokeWidth =
    typeof strokeWidthProp === 'string' ? getTokenValue(strokeWidthProp, 'size') : strokeWidthProp

  const color = colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 18 17" width={size} {...svgProps}>
      <Rect fill="white" height="3.1875" opacity="0.3" rx="1.0625" width="8.46875" y="0.53125" />
      <Rect
        fill="white"
        height="3.1875"
        opacity="0.2"
        rx="1.0625"
        width="8.46875"
        x="9.53125"
        y="0.53125"
      />
      <Rect
        fill="url(#paint0_linear_726_11704)"
        height="3.1875"
        rx="1.0625"
        width="8.46875"
        y="4.78125"
      />
      <Rect
        fill="white"
        height="3.1875"
        opacity="0.3"
        rx="1.0625"
        width="8.46875"
        x="9.53125"
        y="4.78125"
      />
      <Rect fill="white" height="3.1875" opacity="0.3" rx="1.0625" width="8.46875" y="9.03125" />
      <Rect
        fill="white"
        height="3.1875"
        opacity="0.8"
        rx="1.0625"
        width="8.46875"
        x="9.53125"
        y="9.03125"
      />
      <Rect fill="white" height="3.1875" opacity="0.2" rx="1.0625" width="8.46875" y="13.2812" />
      <Rect
        fill="url(#paint1_linear_726_11704)"
        height="3.1875"
        rx="1.0625"
        width="8.46875"
        x="9.53125"
        y="13.2812"
      />
      <Defs>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_726_11704"
          x1="1.41146"
          x2="3.41039"
          y1="5.02273"
          y2="10.9584">
          <Stop stopColor="#FF57EE" />
          <Stop offset="0.9375" stopColor="#FFB8A2" />
        </LinearGradient>
        <LinearGradient
          gradientUnits="userSpaceOnUse"
          id="paint1_linear_726_11704"
          x1="10.9427"
          x2="12.9416"
          y1="13.5227"
          y2="19.4584">
          <Stop stopColor="#FF57EE" />
          <Stop offset="0.9375" stopColor="#FFB8A2" />
        </LinearGradient>
      </Defs>
    </Svg>
  )
}

Icon.displayName = 'SeedPhraseIcon'

export const SeedPhraseIcon = memo<IconProps>(Icon)
