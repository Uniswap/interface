import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#7D7D7D',
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 24 21" width={size} {...svgProps}>
      <Path
        d="M8.21098 0.0318203C8.22035 0.0552664 9.94603 3.03762 12.0422 6.66709L15.8546 13.2695H19.6717H23.4888L23.3809 13.0867C23.32 12.9882 21.5943 10.0011 19.5451 6.45138L15.8171 -0.00100422H12.0046C9.90851 -0.00100422 8.2016 0.0130634 8.21098 0.0318203Z"
        fill={color ?? '#7D7D7D'}
      />
      <Path
        d="M3.60144 7.95688C1.62724 11.4269 0.00941861 14.3014 3.99653e-05 14.3436C-0.014028 14.428 3.69054 20.9648 3.76557 20.9883C3.81715 21.007 11.0715 8.44925 11.095 8.31326C11.1044 8.23354 7.29194 1.67799 7.2216 1.65454C7.20284 1.64516 5.57565 4.48215 3.60144 7.95688Z"
        fill={color ?? '#7D7D7D'}
      />
      <Path
        d="M9.34597 14.4745C9.30377 14.5495 8.455 16.0407 7.45618 17.7945L5.63672 20.9832L12.9286 20.9972C18.7246 21.0066 20.2346 20.9925 20.2768 20.9503C20.3518 20.8659 24.0001 14.4417 24.0001 14.3901C24.0001 14.3666 20.9849 14.3479 16.7129 14.3479H9.421L9.34597 14.4745Z"
        fill={color ?? '#7D7D7D'}
      />
    </Svg>
  )
})

Icon.displayName = 'GoogleDrive'

export const GoogleDrive = memo<IconProps>(Icon)
