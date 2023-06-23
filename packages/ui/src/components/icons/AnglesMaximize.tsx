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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 18 18" width={size} {...svgProps}>
      <Path
        d="M12.2805 10.2199C12.5738 10.5132 12.5738 10.9872 12.2805 11.2805L9.28049 14.2805C9.13424 14.4268 8.94221 14.5002 8.75021 14.5002C8.55821 14.5002 8.36619 14.4268 8.21994 14.2805L5.21994 11.2805C4.92669 10.9872 4.92669 10.5132 5.21994 10.2199C5.51319 9.92669 5.98724 9.92669 6.28049 10.2199L8.75021 12.6897L11.2199 10.2199C11.5132 9.92669 11.9872 9.92669 12.2805 10.2199ZM6.28049 8.28049L8.75021 5.81076L11.2199 8.28049C11.3662 8.42674 11.5582 8.50021 11.7502 8.50021C11.9422 8.50021 12.1342 8.42674 12.2805 8.28049C12.5738 7.98724 12.5738 7.51319 12.2805 7.21994L9.28049 4.21994C8.98724 3.92669 8.51319 3.92669 8.21994 4.21994L5.21994 7.21994C4.92669 7.51319 4.92669 7.98724 5.21994 8.28049C5.51319 8.57374 5.98724 8.57374 6.28049 8.28049Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'AnglesMaximize'

export const AnglesMaximize = memo<IconProps>(Icon)
