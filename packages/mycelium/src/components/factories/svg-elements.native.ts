/**
 * Native leg of the generated icons' SVG host elements (INFRA-3508): the
 * react-native-svg components under the same names the base leg types
 * (react-native-svg is an optional peer with a pinned devDependency, the
 * `ModalCloseIconCompat.native.tsx` mechanism). Resolved by Metro through the
 * generated icons' extensionless
 * `../factories/svg-elements` import — see the base leg's header for why the
 * split lives here rather than on per-icon `.native.tsx` twins.
 *
 * Export set pinned against the base leg by `platform-legs.test.ts`.
 */
import type { FunctionComponent, SVGProps } from 'react'

export {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Mask,
  Path,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Symbol,
  Text,
  Use,
} from 'react-native-svg'

/**
 * Filter-effect primitives react-native-svg does not implement (no
 * `Filter`/`Fe*` exports as of the pinned v15.12.1): re-exporting them from
 * the package would resolve to `undefined` and crash the instant a filtered
 * icon (e.g. `LiquidityProvisionCoins`, `LoadingPriceCurve`) mounts. Emit
 * them as literal lowercase intrinsics (`<filter>`, `<feBlend>`, …) instead —
 * an inert host component either platform accepts regardless of native
 * support — via the WEB leg's own `domTag`
 * trick (`svg-elements.ts`) so the generator's Capitalized-import convention
 * still holds for every icon.
 */
type SvgChildComponent = FunctionComponent<SVGProps<SVGElement>>

function domTag(tag: string): SvgChildComponent {
  return tag as unknown as SvgChildComponent
}

export const FeBlend = domTag('feBlend')
export const FeFlood = domTag('feFlood')
export const FeGaussianBlur = domTag('feGaussianBlur')
export const Filter = domTag('filter')
