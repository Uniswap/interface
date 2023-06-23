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
        d="M13.25 14C13.25 15.79 14.71 17.25 16.5 17.25H21V18C21 20 20 21 18 21H6C4 21 3 20 3 18V5C3 6.1 3.9 7 5 7H18C20 7 21 8 21 10V10.75H16.5C14.71 10.75 13.25 12.21 13.25 14ZM16.5 12.25C15.54 12.25 14.75 13.04 14.75 14C14.75 14.96 15.54 15.75 16.5 15.75H21V12.25H16.5ZM17.02 15C16.47 15 16.01 14.55 16.01 14C16.01 13.45 16.46 13 17.01 13H17.02C17.57 13 18.02 13.45 18.02 14C18.02 14.55 17.57 15 17.02 15ZM15 3H5.75C5.06 3 4.5 3.56 4.5 4.25C4.5 4.94 5.06 5.5 5.75 5.5H17.97C17.82 3.83 16.83 3 15 3Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'WalletFilled'

export const WalletFilled = memo<IconProps>(Icon)
