import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue, useTheme } from 'tamagui'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#68CC58',
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
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 18 19" width={size} {...svgProps}>
      <Path
        d="M13.7878 7.5695C13.6101 7.14125 13.2118 6.875 12.7483 6.875L10.6056 6.92751L11.8926 3.9455C12.0433 3.59675 12.0081 3.1985 11.7996 2.882C11.5911 2.56475 11.2393 2.375 10.8598 2.375H7.49984C6.87134 2.375 6.35009 2.768 6.14609 3.38225L4.18334 8.39375C4.06709 8.741 4.12333 9.11001 4.33783 9.40701C4.55233 9.70401 4.8846 9.875 5.25135 9.875L7.36933 9.8255L5.20557 16.1285C5.14932 16.2935 5.21383 16.4757 5.36158 16.568C5.42308 16.6062 5.49134 16.625 5.56034 16.625C5.65709 16.625 5.75309 16.5875 5.82584 16.5155L13.5448 8.79575C13.8718 8.468 13.9648 7.99775 13.7878 7.5695Z"
        fill={color ?? '#68CC58'}
      />
    </Svg>
  )
})

Icon.displayName = 'Bolt'

export const Bolt = memo<IconProps>(Icon)
