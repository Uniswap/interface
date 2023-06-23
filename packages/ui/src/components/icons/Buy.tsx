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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 19 14" width={size} {...svgProps}>
      <Path
        d="M18.7501 2.99994V4.24994H0.750122V2.99994C0.750122 0.999939 1.75012 -6.10352e-05 3.75012 -6.10352e-05H15.7501C17.7501 -6.10352e-05 18.7501 0.999939 18.7501 2.99994ZM18.7501 5.74994V10.9999C18.7501 12.9999 17.7501 13.9999 15.7501 13.9999H3.75012C1.75012 13.9999 0.750122 12.9999 0.750122 10.9999V5.74994H18.7501ZM8.50012 9.99994C8.50012 9.58594 8.16412 9.24994 7.75012 9.24994H4.75012C4.33612 9.24994 4.00012 9.58594 4.00012 9.99994C4.00012 10.4139 4.33612 10.7499 4.75012 10.7499H7.75012C8.16412 10.7499 8.50012 10.4139 8.50012 9.99994Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Buy'

export const Buy = memo<IconProps>(Icon)
