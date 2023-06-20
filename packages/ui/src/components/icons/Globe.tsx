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
    <Svg fill="none" height={size} viewBox="0 0 20 21" width={size} {...svgProps}>
      <Path
        d="M9.99996 18.9582C14.6023 18.9582 18.3333 15.2272 18.3333 10.6248C18.3333 6.02246 14.6023 2.2915 9.99996 2.2915C5.39759 2.2915 1.66663 6.02246 1.66663 10.6248C1.66663 15.2272 5.39759 18.9582 9.99996 18.9582Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M1.66663 10.625H18.3333"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <Path
        d="M9.99996 2.2915C12.0844 4.57346 13.2689 7.53487 13.3333 10.6248C13.2689 13.7148 12.0844 16.6762 9.99996 18.9582C7.91556 16.6762 6.731 13.7148 6.66663 10.6248C6.731 7.53487 7.91556 4.57346 9.99996 2.2915V2.2915Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Svg>
  )
}

Icon.displayName = 'Globe'

export const Globe = memo<IconProps>(Icon)
