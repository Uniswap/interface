import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Rect, Svg } from 'react-native-svg'
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 85 34" width={size} {...svgProps}>
      <Rect
        height="82.4"
        rx="5.2"
        stroke={color}
        strokeWidth="2.4"
        transform="rotate(90 83.7 1.8)"
        width="30.4"
        x="83.7"
        y="1.8"
      />
      <Path
        d="M12.2 12.8h5.6m-5.6 5h5.6m5.4-5h49.6m-49.6 5h49.6"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2.4"
      />
    </Svg>
  )
})

Icon.displayName = 'EmptyStateTransaction'

export const EmptyStateTransaction = memo<IconProps>(Icon)
