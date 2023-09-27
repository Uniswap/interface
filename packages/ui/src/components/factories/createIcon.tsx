import type { IconProps as TamaguiIconProps } from '@tamagui/helpers-icon'
import { createElement, forwardRef } from 'react'
import { Svg, SvgProps } from 'react-native-svg'
import { ColorTokens, isWeb, Stack, styled, ThemeKeys, usePropsAndStyle } from 'tamagui'

import { withAnimated } from './animated'

type SvgPropsWithRef = SvgProps & { ref: React.ForwardedRef<Svg>; style?: { color?: string } }

export type IconProps = Omit<TamaguiIconProps, 'color'> & {
  // we need the string & {} to allow strings but not lose the intellisense autocomplete
  // eslint-disable-next-line @typescript-eslint/ban-types
  color?: (ColorTokens | ThemeKeys | (string & {})) | null
  Component?: React.FunctionComponent<SvgPropsWithRef>
}

// used by our usePropsAndStyle to resolve a variant
const IconFrame = styled(Stack, {
  variants: {
    size: {
      '...size': (val) => ({
        width: val,
        height: val,
      }),
    },
  },
})

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
  const Icon = forwardRef<Svg, IconProps>((propsIn, ref) => {
    const [props, style] = usePropsAndStyle(
      {
        color: defaultFill ?? (isWeb ? 'currentColor' : undefined),
        size: '$true',
        strokeWidth: 8,
        ...propsIn,
      },
      {
        resolveValues: 'value',
        forComponent: IconFrame,
      }
    )

    const svgProps: SvgPropsWithRef = {
      ref,
      ...props,
      // @ts-expect-error this type is hard to map but its right
      style,
    }

    if (props.Component) {
      return createElement(props.Component, svgProps)
    }

    return getIcon(svgProps)
  })

  Icon.displayName = name

  const IconPlain = forwardRef<Svg, IconProps>((props, ref) => {
    return getIcon({
      ...(props as SvgPropsWithRef),
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
