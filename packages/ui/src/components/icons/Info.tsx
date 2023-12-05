import type { IconProps } from '@tamagui/helpers-icon'
import { forwardRef, memo } from 'react'
import { Path, Svg } from 'react-native-svg'
import { getTokenValue } from 'tamagui'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'

const Icon = forwardRef<Svg, IconProps>((props, ref) => {
  // isWeb currentColor to maintain backwards compat a bit better, on native uses theme color
  const {
    color: colorProp = '#99A1BD24',
    size: sizeProp = '$true',
    strokeWidth: strokeWidthProp,
    ...restProps
  } = props
  const colors = useSporeColors()

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
    colors[colorProp]?.get() ?? colorProp ?? colors.color.get()

  const svgProps = {
    ...restProps,
    size,
    strokeWidth,
    color,
  }

  return (
    <Svg ref={ref} fill="none" height={size} viewBox="0 0 24 24" width={size} {...svgProps}>
      <Path
        d="M12 2C6.477 2 2 6.477 2 12C2 17.523 6.477 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z"
        fill={color ?? '#99A1BD24'}
      />
      <Path
        d="M11.9851 16.75C12.3991 16.75 12.7351 16.414 12.7351 16V11.429C12.7351 11.015 12.3991 10.679 11.9851 10.679C11.5711 10.679 11.2351 11.015 11.2351 11.429V16C11.2351 16.414 11.5711 16.75 11.9851 16.75Z"
        fill={color}
      />
      <Path
        d="M11 8C11 8.552 11.4531 9 12.0051 9C12.5571 9 13.0051 8.552 13.0051 8C13.0051 7.448 12.5581 7 12.0051 7H11.9951C11.4431 7 11 7.448 11 8Z"
        fill={color}
      />
    </Svg>
  )
})

Icon.displayName = 'Info'

export const Info = memo<IconProps>(Icon)
