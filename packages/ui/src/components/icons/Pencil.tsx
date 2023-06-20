import type { IconProps } from '@tamagui/helpers-icon'
import React, { memo } from 'react'
import { Path, Svg } from 'react-native-svg'
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
    <Svg fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M15.5909 5.58492C15.7763 5.39948 15.9964 5.25238 16.2387 5.15201C16.481 5.05165 16.7407 5 17.003 5C17.2652 5 17.5249 5.05165 17.7672 5.15201C18.0095 5.25238 18.2296 5.39948 18.4151 5.58492C18.6005 5.77036 18.7476 5.99051 18.848 6.2328C18.9483 6.47509 19 6.73478 19 6.99703C19 7.25928 18.9483 7.51897 18.848 7.76126C18.7476 8.00355 18.6005 8.2237 18.4151 8.40914L8.88331 17.9409L5 19L6.05909 15.1167L15.5909 5.58492Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  )
}

Icon.displayName = 'Pencil'

export const Pencil = memo<IconProps>(Icon)
