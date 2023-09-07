import type { IconProps as TamaguiIconProps } from '@tamagui/helpers-icon'
import { createElement, forwardRef } from 'react'
import { Svg, SvgProps } from 'react-native-svg'
import { isWeb, useProps } from 'tamagui'

import { withAnimated } from './animated'

type SvgPropsWithRef = SvgProps & { ref: React.ForwardedRef<Svg>; style?: { color?: string } }

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createIcon({
  name,
  getIcon,
  defaultFill,
}: {
  name: string
  getIcon: (props: SvgPropsWithRef) => JSX.Element
  defaultFill?: string
}) {
  type IconProps = TamaguiIconProps & {
    Component?: React.FunctionComponent<SvgPropsWithRef>
  }

  const Icon = forwardRef<Svg, IconProps>((propsIn, ref) => {
    const props = useProps(
      {
        color: defaultFill ?? (isWeb ? 'currentColor' : undefined),
        size: '$true',
        ...propsIn,
      },
      {
        resolveValues: 'value',
      }
    )

    const { strokeWidth: strokeWidthProp, style, size, color, width, height, ...restProps } = props

    const svgProps: SvgPropsWithRef = {
      ref,
      ...restProps,
      strokeWidth: strokeWidthProp ?? size,
      style: {
        width: width ?? size,
        height: height ?? size,
        color,
        ...style,
      },
    }

    if (props.Component) {
      return createElement(props.Component, svgProps)
    }

    return getIcon(svgProps)
  })

  Icon.displayName = name

  const IconPlain = forwardRef<Svg, IconProps>((props, ref) => {
    return getIcon({
      ...props,
      ref,
    })
  })

  IconPlain.displayName = name

  const AnimatedIconPlain = withAnimated(IconPlain)

  const AnimatedIcon = forwardRef<Svg, IconProps>((props: IconProps, ref) => (
    <Icon ref={ref} {...props} Component={AnimatedIconPlain} />
  ))

  AnimatedIcon.displayName = `Animated${name}`

  return [Icon, AnimatedIcon] as const
}
