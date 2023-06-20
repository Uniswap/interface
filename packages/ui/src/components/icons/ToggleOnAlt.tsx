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
        d="M16 6H8C4.686 6 2 8.686 2 12C2 15.314 4.686 18 8 18H16C19.314 18 22 15.314 22 12C22 8.686 19.314 6 16 6ZM16 15C14.343 15 13 13.657 13 12C13 10.343 14.343 9 16 9C17.657 9 19 10.343 19 12C19 13.657 17.657 15 16 15Z"
        fill={color}
      />
    </Svg>
  )
}

Icon.displayName = 'ToggleOnAlt'

export const ToggleOnAlt = memo<IconProps>(Icon)
