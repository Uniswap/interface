import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, isWeb, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
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

  const color =
    // @ts-expect-error its fine to access colorProp undefined
    theme[colorProp]?.get() ?? colorProp ?? theme.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M15.03 9.09003C15.35 9.03003 15.67 9 16 9C18.76 9 21 11.24 21 14C21 16.76 18.76 19 16 19H9.5C5.91 19 3 16.09 3 12.5C3 8.91 5.91 6 9.5 6C11.146 6 12.648 6.61297 13.792 7.62097C14.274 8.04597 14.692 8.54103 15.03 9.09003Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Cloud'

export const Cloud = memo<IconProps>(Icon)
