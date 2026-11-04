import { forwardRef } from 'react'
import type {
  CSSProperties,
  ForwardedRef,
  ForwardRefExoticComponent,
  MouseEvent,
  ReactElement,
  RefAttributes,
  SVGProps,
} from 'react'
// Type-only: erased at compile time, so the web bundle never touches the
// optional react-native-svg peer (the identical-exports rule allows type-only
// imports in shared files).
import type { GestureResponderEvent } from 'react-native'
import type { Svg, SvgProps as NativeSvgProps } from 'react-native-svg'
import { domTestId } from '../../compat/dom-test-id'
import { partitionIconProps } from '../../compat/icon-prop-partition'
import {
  applyIconCssLane,
  composeIconPools,
  DEFAULT_ICON_SIZE,
  iconSizeAxes,
  resolveIconColor,
  resolveIconStrokeWidth,
  type IconColor,
  type IconCompatPoolProps,
  type IconCompatStyleProps,
  type IconInlineStyle,
  type IconPoolResolution,
} from '../../compat/icon-props'
import { markMyceliumIcon } from '../../compat/primitive-marker'
import type { SporeColorToken, SporeSpaceToken } from '../../compat/tokens'

/**
 * The legacy `ui/src` icon styling surface, first-class (INFRA-3320 ruling:
 * icon styling stays the same through the migration, so conversions are pure
 * import swaps). `IconCompatStyleProps` + `IconCompatPoolProps` carry the
 * censused style surface — size (incl. the legacy `{ width, height }` object
 * form), color, spacing/sizing/layout props with token values, `rotate` /
 * `transform`, and the `$group-*` / `$xs` / `$sm` pools — resolved through
 * the compat machinery (`compat/icon-props.ts`).
 *
 * The `Omit` list is every SVG presentation attribute the style surface
 * re-types (a Tamagui style prop of the same name means the STYLE semantics
 * on this surface: `rotate="180deg"` rotates via CSS transform, `opacity` is
 * a number, `width`/`height` are CSS sizing that beats `size` per axis), plus
 * `x` — a ledger-rejected Tamagui shorthand that shadows the SVG attribute
 * (see `compat/icon-prop-coverage.ts` for the full rejected ledger).
 *
 * `color` mirrors the legacy widened union (`ColorTokens | (string & {}) |
 * null`); `fill` and `strokeWidth` accept the same token slots legacy did
 * (`fill` rides inline style because `var()` is unreliable in presentation
 * attributes; `strokeWidth` space tokens resolve to px).
 *
 * `hoverColor` mirrors the legacy web-only own-hover color swap, as CSS: it
 * compiles to a `hover:` variant class through the emission engine (no JS
 * hover wrapper), and the base color is hoisted onto the class channel for
 * that render so the hover class can win. Legacy treated falsy values as
 * absent (no hover wrapper), so `null`/`''` stay no-ops here.
 */
export type IconProps = Omit<
  SVGProps<SVGSVGElement>,
  | 'color'
  | 'cursor'
  | 'display'
  | 'fill'
  | 'height'
  | 'opacity'
  | 'pointerEvents'
  | 'rotate'
  | 'strokeWidth'
  | 'style'
  | 'transform'
  | 'width'
  | 'x'
> &
  IconCompatStyleProps &
  IconCompatPoolProps & {
    fill?: SporeColorToken | (string & {})
    strokeWidth?: SporeSpaceToken | number | (string & {})
    /**
     * Both style flavors, honest per platform (the #38686 / INFRA-3314
     * mechanism): DOM `CSSProperties` on web, RN `StyleProp` (arrays and all)
     * on device — each leg merges its own dialect.
     */
    style?: CSSProperties | NativeSvgProps['style']
    hoverColor?: IconColor
    /**
     * Legacy RN testID (INFRA-2962): maps to `data-testid` here (the
     * `../../compat/dom-test-id` convention every compat web leg shares), and
     * to the real RN `testID` prop on the native leg. Icons otherwise spread
     * `data-*`/`aria-*` verbatim onto the SVG but never had this RN-flavored
     * name — a literal `data-testid` JSX prop is unaffected by this addition.
     */
    testID?: string
    /**
     * Legacy Tamagui icons dispatch press directly (INFRA-3750, the
     * packages/wallet ChooseNftModal.tsx close icon) — Tamagui's
     * `NonStyleProps` includes it generically. Mapped to the DOM `onClick`
     * on web (a bare `<svg>` has no native press concept); react-native-svg's
     * `Svg` already dispatches it on device, so the native leg forwards it
     * through the SAME passthrough channel `testID` did not need to.
     */
    onPress?: IconPressHandler
  }

export type GeneratedIconProps = IconProps
/**
 * The ref target is platform-dependent and typed as the honest union
 * (INFRA-3508): the rendered DOM
 * `SVGSVGElement` on web, the react-native-svg `Svg` instance on device.
 */
export type GeneratedIcon = ForwardRefExoticComponent<GeneratedIconProps & RefAttributes<Svg | SVGSVGElement>>

/**
 * Bivariant handler type (the `../../button-compat/press-handler.ts`
 * convention): keeps parameter typing bivariant so a handler explicitly
 * annotated against one leg's event type (the web `MouseEventHandler` idiom)
 * stays assignable, while a handler with an INFERRED event parameter may only
 * touch members present on both — the union stops a shared handler from
 * calling a DOM-only method and crashing on device.
 */
type IconBivariantHandler<E> = { bivarianceHack(this: void, event: E): void }['bivarianceHack']

/** What the web leg's `<svg>` dispatches (mapped from `onClick`) vs. what react-native-svg's `Svg` dispatches natively. */
export type IconPressHandler = IconBivariantHandler<MouseEvent<SVGSVGElement> | GestureResponderEvent>

export type SvgPropsWithRef = Omit<SVGProps<SVGSVGElement>, 'ref'> & { ref: ForwardedRef<Svg | SVGSVGElement> }

/**
 * Icon factory (styling surface per INFRA-3320): no react-native-svg at
 * runtime on this leg.
 *
 * PLATFORM SPLIT (INFRA-3508): this base leg IS the web implementation — it
 * cannot be a throwing stub because the `./icons/*` exports map resolves deep
 * icon imports to exact base files, and the generated icons call the factory
 * at module scope. Metro resolves `createIcon.native.tsx` (react-native-svg dialect) through the generated
 * icons' extensionless import instead; the generated markup itself is
 * platform-agnostic via `svg-elements.ts` / `svg-elements.native.ts`. Export
 * parity across the legs is pinned by `platform-legs.test.ts`.
 *
 * Defaults mirror legacy: size 8 (`$icon.8`), root `strokeWidth` 8, `color`
 * falling back to the icon's captured `defaultFill` and then `currentColor`
 * (children reference `currentColor`, so `color` cascades to fills and
 * strokes).
 *
 * Channel invariant: EVERY wrapper value — size (token, numeric, object, or
 * the default), color (token-resolved, `var()`, raw string, or the
 * `defaultFill`/`currentColor` default), and the widened CSS-lane props —
 * rides inline style, never a presentation attribute, matching legacy
 * specificity: container CSS like `[&_svg]:size-4` or `svg { color: … }`
 * must lose to props and defaults on both systems. The caller's own `style`
 * still wins. The one scoped exception: a `$group-*`/media pool (or
 * `hoverColor`, which rides the same engine as a `hover:` pool) moves the
 * exact base props it overrides onto the class channel for that render
 * (inline style would beat the variant classes) — see
 * `compat/icon-props.ts`.
 *
 * The second tuple member keeps the legacy `Animated<Name>` export name. The
 * legacy twin wraps the icon with reanimated; on the web animation comes
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
  // The ref generic is the honest platform union (see `GeneratedIcon`); this
  // web leg only ever renders — and forwards — the DOM element.
  const Icon = forwardRef<Svg | SVGSVGElement, GeneratedIconProps>(function IconComponent(props, ref) {
    const { size, color, hoverColor, strokeWidth = 8, fill, style, className, testID, onPress, ...rest } = props

    // Partition the remaining props: CSS lane (inline style), pools (class
    // emission), ledger-rejected (dev throw / prod drop), SVG passthrough —
    // shared with the native leg (compat/icon-props.ts).
    const { cssLane, pools, passthrough } = partitionIconProps(rest as Record<string, unknown>)

    const rawColor = color ?? defaultFill ?? 'currentColor'
    // Legacy truthiness: a null/empty hoverColor rendered no hover wrapper.
    const rawHoverColor = hoverColor === null || hoverColor === '' ? undefined : hoverColor
    let poolResolution: IconPoolResolution | undefined
    if (pools !== undefined || rawHoverColor !== undefined) {
      poolResolution = composeIconPools({
        pools: pools ?? {},
        cssLane,
        size,
        color: rawColor,
        hoverColor: rawHoverColor,
        className,
      })
    }

    const svgStyle: IconInlineStyle = {}
    if (poolResolution?.colorHoisted !== true) {
      // An unmapped token resolves to `undefined` (logged, not thrown), and
      // `currentColor` is what this lane already uses when no colour is passed
      // at all (see `rawColor` above), so the two cases render identically.
      svgStyle.color = resolveIconColor(rawColor) ?? 'currentColor'
    }
    if (poolResolution?.sizingHoisted !== true) {
      const axes = iconSizeAxes(size ?? DEFAULT_ICON_SIZE)
      svgStyle.width = `${axes.width}px`
      svgStyle.height = `${axes.height}px`
    }
    if (fill !== undefined) {
      // Inline style, not the presentation attribute: token fills resolve to
      // `var()`, which presentation attributes do not reliably support — and
      // the style channel keeps legacy specificity (props beat container CSS).
      // Dropped rather than defaulted when unmapped: no fill override at all,
      // so the glyph keeps whatever it inherits instead of an invented colour.
      const resolvedFill = resolveIconColor(fill)
      if (resolvedFill !== undefined) {
        svgStyle.fill = resolvedFill
      }
    }
    // CSS lane last: an explicit width/height beats the resolved size on that
    // axis, riding the same inline-style channel as everything else. Pools
    // hand back the lane surviving the hoist; without pools it is untouched.
    applyIconCssLane(poolResolution?.cssLane ?? cssLane, svgStyle)

    // `onPress` maps to the DOM `onClick` (a bare `<svg>` has no native press
    // concept); a raw `onClick` riding the passthrough spread still fires
    // first, so a caller supplying both never silently loses one.
    const rawOnClick = passthrough['onClick'] as ((event: MouseEvent<SVGSVGElement>) => void) | undefined
    const handleClick =
      onPress === undefined && rawOnClick === undefined
        ? undefined
        : (event: MouseEvent<SVGSVGElement>): void => {
            rawOnClick?.(event)
            onPress?.(event)
          }

    return getIcon({
      strokeWidth: resolveIconStrokeWidth(strokeWidth),
      ...passthrough,
      className: poolResolution === undefined ? className : poolResolution.emission.className,
      // Web callers pass the DOM flavor of the widened per-platform `style`
      // union; the RN flavor only occurs on the native leg.
      style: { ...svgStyle, ...poolResolution?.emission.style, ...(style as CSSProperties | undefined) },
      ...domTestId(testID),
      onClick: handleClick,
      ref,
    })
  })
  Icon.displayName = name
  // Icon marker (stamps the generic primitive marker too — see
  // compat/primitive-marker.ts): the legacy TouchableArea injects
  // boundary-mapped hover `color` guidance into icon-marked children
  // (INFRA-3537), while other legacy color-injecting wrappers still see the
  // generic marker and skip the clone. An unmapped injected colour no longer
  // throws: `resolveIconColor` logs one error and drops, so such a wrapper
  // costs a colour, not the whole render.
  markMyceliumIcon(Icon)

  return [Icon, Icon] as const
}
