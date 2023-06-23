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
        d="M15 3C11.69 3 9 5.69 9 9C9 9.61 9.09001 10.19 9.26001 10.74L3 17V21H7V18H10L13.26 14.74C13.81 14.91 14.39 15 15 15C18.31 15 21 12.31 21 9C21 5.69 18.31 3 15 3ZM16.02 9.25C15.331 9.25 14.7649 8.69 14.7649 8C14.7649 7.31 15.32 6.75 16.01 6.75H16.02C16.71 6.75 17.27 7.31 17.27 8C17.27 8.69 16.71 9.25 16.02 9.25Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Key'

export const Key = memo<IconProps>(Icon)
