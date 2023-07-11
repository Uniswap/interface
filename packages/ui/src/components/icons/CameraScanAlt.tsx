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
    <Svg
      ref={ref}
      fill="none"
      height={size}
      stroke={color}
      viewBox="0 0 17 16"
      width={size}
      {...svgProps}>
      <Path
        d="M5.00016 0.5H2.50016C2.05814 0.5 1.63421 0.675595 1.32165 0.988155C1.00909 1.30072 0.833496 1.72464 0.833496 2.16667V4.66667M15.8335 4.66667V2.16667C15.8335 1.72464 15.6579 1.30072 15.3453 0.988155C15.0328 0.675595 14.6089 0.5 14.1668 0.5H11.6668M11.6668 15.5H14.1668C14.6089 15.5 15.0328 15.3244 15.3453 15.0118C15.6579 14.6993 15.8335 14.2754 15.8335 13.8333V11.3333M0.833496 11.3333V13.8333C0.833496 14.2754 1.00909 14.6993 1.32165 15.0118C1.63421 15.3244 2.05814 15.5 2.50016 15.5H5.00016"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
})

Icon.displayName = 'CameraScanAlt'

export const CameraScanAlt = memo<IconProps>(Icon)
