/**
 * ButtonCompat's visual + positioning widening: opacity, flexShrink, flexGrow,
 * overflow, the shadow trio, position/top, alignItems. Split from `./dimensions` only for
 * the oxlint `max-lines` cap.
 */
import type { BorderWidthValue, ColorValue, OverflowValue, PositionValue, SpaceValue } from '../compat/props'
import {
  ALIGN_ITEMS_CLASS,
  commonStyleClasses,
  enumClass,
  positionAndTopClasses,
  type CommonStyleClassOptions,
} from '../compat/style-classes'
import type { AlignItems } from '../flex-compat/props'

// A type alias, not an interface: only object-literal types get the implicit
// `$group-*` index signature `CompatProps<S>` relies on — an interface here
// silently breaks inference for the whole intersection (measured regression).
export type ButtonCompatVisualProps = {
  /** Plain 0-1 opacity, no token resolution. Wired on both legs. */
  opacity?: number
  /** Flex shrink factor, independent of `./dimensions`' numeric `flex`. Wired on both legs. */
  flexShrink?: number
  /** Flex grow factor alone (`grow-[n]`); a numeric `flex` set alongside wins. Wired on both legs. */
  flexGrow?: number
  /** Clips the frame's children, e.g. an absolutely positioned progress fill inside the rounded frame. Wired on both legs. */
  overflow?: OverflowValue
  /** Same `ColorValue` contract as `CompatStyleProps.shadowColor`. Wired on both legs. */
  shadowColor?: ColorValue
  /** Folds into the composed `box-shadow` via `color-mix`. Wired on both legs. */
  shadowOpacity?: number
  /** Same `BorderWidthValue` contract as the shared shadow surface. Wired on both legs. */
  shadowRadius?: BorderWidthValue
  /** Web-only like `height`: native accepts it for call-site parity and dev-warns the drop. */
  position?: PositionValue
  /** Position offset; same web-only status as `position`. */
  top?: SpaceValue
  /** Cross-axis alignment of the icon/label row. Web-only: native dev-warns the drop. */
  alignItems?: AlignItems
}

/**
 * `options.shadowColorExpression` lets the native leg swap in its
 * drop-instead-of-throw shadow-color policy: always-mounted chrome must
 * degrade a shadow, never crash on an unmapped token. Web keeps the default
 * throwing policy.
 */
export function buttonCompatVisualClasses(
  props: ButtonCompatVisualProps,
  options: CommonStyleClassOptions = {},
): string[] {
  const cls: string[] = []
  if (props.alignItems !== undefined) {
    cls.push(enumClass({ map: ALIGN_ITEMS_CLASS, value: props.alignItems, cssProp: 'align-items' }))
  }
  for (const entry of positionAndTopClasses(props.position, props.top)) {
    if (typeof entry === 'string' && entry !== '') {
      cls.push(entry)
    }
  }
  if (props.opacity !== undefined) {
    cls.push(`opacity-[${props.opacity}]`)
  }
  if (props.flexShrink !== undefined) {
    cls.push(`shrink-[${props.flexShrink}]`)
  }
  if (props.flexGrow !== undefined) {
    cls.push(`grow-[${props.flexGrow}]`)
  }
  if (props.overflow !== undefined) {
    cls.push(props.overflow === 'unset' ? '[overflow:unset]' : `overflow-${props.overflow}`)
  }
  if (props.shadowColor !== undefined || props.shadowOpacity !== undefined || props.shadowRadius !== undefined) {
    for (const entry of commonStyleClasses(
      { shadowColor: props.shadowColor, shadowOpacity: props.shadowOpacity, shadowRadius: props.shadowRadius },
      options,
    )) {
      if (typeof entry === 'string' && entry !== '') {
        cls.push(entry)
      }
    }
  }
  return cls
}
