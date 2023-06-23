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
        d="M1.5 3.75L1.5 10.25M22.5 3.75V10.25M9.1875 9.75V12M14.8125 9.75V12M9 15.75H15M8.25 21H15.75C17.8211 21 19.5 19.2618 19.5 17.1176V6.44118C19.5 5.36909 18.6605 4.5 17.625 4.5H6.375C5.33947 4.5 4.5 5.36909 4.5 6.44118V17.1176C4.5 19.2618 6.17893 21 8.25 21Z"
        stroke={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Flashbots'

export const Flashbots = memo<IconProps>(Icon)
