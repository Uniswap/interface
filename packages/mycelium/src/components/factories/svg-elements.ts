/**
 * SVG host elements for the generated icons (INFRA-3508): one import site
 * whose resolution carries the whole icon set's platform split.
 *
 * The `./icons/*` subpath in package.json maps deep icon imports to exact
 * `.tsx` files, so a per-icon `.native.tsx` twin would never be resolved
 * through the exports map — bundlers resolve an exports target with an
 * explicit extension literally. The split therefore lives on this module's
 * EXTENSIONLESS internal import instead: every generated icon renders
 * `<Svg>`/`<Path>`/… from here, web resolvers load this base leg (plain DOM
 * tag names — byte-identical markup to the previous lowercase emission), and
 * Metro loads `svg-elements.native.ts`
 * (react-native-svg components).
 *
 * The values are intrinsic tag STRINGS typed as components: React renders a
 * string element type as the DOM host element, so the runtime output is
 * exactly the `<svg>`/`<path>` markup the generator used to emit inline.
 *
 * Keep the export set in lockstep with the generator's TAG_MAP
 * (`src/scripts/componentize-icons.ts`) and with `svg-elements.native.ts`
 * (pinned by `platform-legs.test.ts`).
 */
import type { ForwardedRef, FunctionComponent, SVGProps } from 'react'
import type { Svg as NativeSvg } from 'react-native-svg'

/**
 * The root element's ref is the honest per-platform union (the widened
 * `GeneratedIcon` contract, INFRA-3314 mechanism): the DOM `SVGSVGElement`
 * on web, the react-native-svg `Svg` instance on device. Both single-flavor
 * ref types are accepted alongside the union — a callback ref over one
 * flavor is contravariantly incompatible with the union form, and
 * hand-written icons legitimately carry the DOM flavor.
 */
type SvgRootRef = ForwardedRef<NativeSvg | SVGSVGElement> | ForwardedRef<SVGSVGElement> | ForwardedRef<NativeSvg>

type SvgRootComponent = FunctionComponent<Omit<SVGProps<SVGSVGElement>, 'ref'> & { ref?: SvgRootRef }>

/** Child elements never take refs in generated output; attributes are the DOM SVG surface. */
type SvgChildComponent = FunctionComponent<SVGProps<SVGElement>>

function domTag(tag: string): SvgChildComponent {
  return tag as unknown as SvgChildComponent
}

export const Svg = 'svg' as unknown as SvgRootComponent
export const Circle = domTag('circle')
export const ClipPath = domTag('clipPath')
export const Defs = domTag('defs')
export const Ellipse = domTag('ellipse')
export const FeBlend = domTag('feBlend')
export const FeFlood = domTag('feFlood')
export const FeGaussianBlur = domTag('feGaussianBlur')
export const Filter = domTag('filter')
export const G = domTag('g')
export const Line = domTag('line')
export const LinearGradient = domTag('linearGradient')
export const Mask = domTag('mask')
export const Path = domTag('path')
export const Polygon = domTag('polygon')
export const Polyline = domTag('polyline')
export const RadialGradient = domTag('radialGradient')
export const Rect = domTag('rect')
export const Stop = domTag('stop')
export const Symbol = domTag('symbol')
export const Text = domTag('text')
export const Use = domTag('use')
