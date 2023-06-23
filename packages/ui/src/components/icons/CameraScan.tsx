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
    <Svg
      ref={ref}
      fill="none"
      height={size}
      stroke={color}
      viewBox="0 0 274 274"
      width={size}
      {...svgProps}>
      <Path
        d="M78.3333 5H34.3333C26.5536 5 19.0926 8.09047 13.5915 13.5915C8.09047 19.0926 5 26.5536 5 34.3333V78.3333M269 78.3333V34.3333C269 26.5536 265.91 19.0926 260.408 13.5915C254.907 8.09047 247.446 5 239.667 5H195.667M195.667 269H239.667C247.446 269 254.907 265.91 260.408 260.408C265.91 254.907 269 247.446 269 239.667V195.667M5 195.667V239.667C5 247.446 8.09047 254.907 13.5915 260.408C19.0926 265.91 26.5536 269 34.3333 269H78.3333"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
})

Icon.displayName = 'CameraScan'

export const CameraScan = memo<IconProps>(Icon)
