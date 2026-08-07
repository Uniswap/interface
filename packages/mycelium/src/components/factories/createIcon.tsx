import { forwardRef } from 'react'
import type { ForwardedRef, ForwardRefExoticComponent, ReactElement, RefAttributes, SVGProps } from 'react'

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'color'> & {
  size?: number | string
  color?: string | null
}

export type GeneratedIconProps = IconProps
export type GeneratedIcon = ForwardRefExoticComponent<GeneratedIconProps & RefAttributes<SVGSVGElement>>

export type SvgPropsWithRef = SVGProps<SVGSVGElement> & { ref: ForwardedRef<SVGSVGElement> }

/**
 * Plain-React port of the legacy `ui/src/components/factories/createIcon`
 * (INFRA-2956): same call shape, no Tamagui/react-native-svg.
 *
 * Defaults mirror the legacy rendered output exactly: size 8 (`$icon.8`),
 * root `strokeWidth` 8, `color` falling back to the icon's captured
 * `defaultFill` and then `currentColor` (children reference `currentColor`,
 * so `color` cascades to fills and strokes).
 *
 * The second tuple member keeps the legacy `Animated<Name>` export name.
 * The legacy twin wraps the icon with reanimated; on the web animation comes
 * from CSS, so the twin is the base component itself.
 */
export function createIcon({
  name,
  getIcon,
  defaultFill,
}: {
  name: string
  getIcon: (props: SvgPropsWithRef) => ReactElement
  defaultFill?: string
}): readonly [GeneratedIcon, GeneratedIcon] {
  const Icon = forwardRef<SVGSVGElement, GeneratedIconProps>(function IconComponent(
    { size = 8, color, strokeWidth = 8, ...rest },
    ref,
  ) {
    return getIcon({
      width: size,
      height: size,
      color: color ?? defaultFill ?? 'currentColor',
      strokeWidth,
      ...rest,
      ref,
    })
  })
  Icon.displayName = name

  return [Icon, Icon] as const
}
