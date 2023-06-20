import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Defs, G, Path, Rect, Svg } from 'react-native-svg'
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
    <Svg fill="none" height={size} viewBox="0 0 19 18" width={size} {...svgProps}>
      <G clipPath="url(#clip0_4054_133249)">
        <Path
          clipRule="evenodd"
          d="M14.4506 4.36502L13.2518 5.56373L14.563 6.87493L18 3.43797L14.5631 -3.00459e-07L13.2517 1.31098L14.4511 2.51071L5.95378 2.51071C3.90556 2.51071 2.24515 4.17111 2.24515 6.21933C2.24515 8.26755 3.90556 9.92795 5.95377 9.92795L13.371 9.92795C14.3951 9.92795 15.2253 10.7582 15.2253 11.7823C15.2253 12.8064 14.3951 13.6366 13.371 13.6366L4.87424 13.6366L6.07295 12.4379L4.76175 11.1267L1.32458 14.5638L4.76186 18L6.07284 16.6886L4.87475 15.4909L13.371 15.4909C15.4192 15.4909 17.0796 13.8305 17.0796 11.7823C17.0796 9.73405 15.4192 8.07364 13.371 8.07364L5.95377 8.07364C4.92967 8.07364 4.09946 7.24344 4.09946 6.21933C4.09946 5.19522 4.92967 4.36502 5.95378 4.36502L14.4506 4.36502Z"
          fill={color}
          fillRule="evenodd"
        />
      </G>
      <Defs>
        <clipPath id="clip0_4054_133249">
          <Rect fill="white" height="18" width="19" />
        </clipPath>
      </Defs>
    </Svg>
  )
}

Icon.displayName = 'SwapActionButton'

export const SwapActionButton = memo<IconProps>(Icon)
