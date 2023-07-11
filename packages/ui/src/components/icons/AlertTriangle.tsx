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
    <Svg ref={ref} fill={color} height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M21.6074 17.1522L15.0004 4.79599C13.7204 2.40199 10.2814 2.40199 9.00042 4.79599L2.39349 17.1522C1.21949 19.3482 2.81353 22.0001 5.30853 22.0001H18.6923C21.1863 22.0001 22.7814 19.3472 21.6074 17.1522ZM11.2504 10.0001C11.2504 9.58609 11.5864 9.25009 12.0004 9.25009C12.4144 9.25009 12.7504 9.58609 12.7504 10.0001V14.0001C12.7504 14.4141 12.4144 14.7501 12.0004 14.7501C11.5864 14.7501 11.2504 14.4141 11.2504 14.0001V10.0001ZM12.0204 18.0001C11.4684 18.0001 11.0153 17.5521 11.0153 17.0001C11.0153 16.4481 11.4584 16.0001 12.0104 16.0001H12.0204C12.5734 16.0001 13.0204 16.4481 13.0204 17.0001C13.0204 17.5521 12.5724 18.0001 12.0204 18.0001Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'AlertTriangle'

export const AlertTriangle = memo<IconProps>(Icon)
