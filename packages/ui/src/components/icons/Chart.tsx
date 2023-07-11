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

  const size =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      sizeProp,
      'size'
    ) ?? sizeProp

  const strokeWidth =
    getTokenValue(
      // @ts-expect-error it falls back to undefined
      strokeWidthProp,
      'size'
    ) ?? strokeWidthProp

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
        d="M12.5 21H11.5C10.5 21 10 20.5 10 19.5V4.5C10 3.5 10.5 3 11.5 3H12.5C13.5 3 14 3.5 14 4.5V19.5C14 20.5 13.5 21 12.5 21ZM21 19.5V9.5C21 8.5 20.5 8 19.5 8H18.5C17.5 8 17 8.5 17 9.5V19.5C17 20.5 17.5 21 18.5 21H19.5C20.5 21 21 20.5 21 19.5ZM7 19.5V13.5C7 12.5 6.5 12 5.5 12H4.5C3.5 12 3 12.5 3 13.5V19.5C3 20.5 3.5 21 4.5 21H5.5C6.5 21 7 20.5 7 19.5Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Chart'

export const Chart = memo<IconProps>(Icon)
