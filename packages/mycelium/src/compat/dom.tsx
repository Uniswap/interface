/* oxlint-disable max-lines -- at the cap; splitting the file would bury the one-line containment change */
/**
 * The component-agnostic DOM wrapper for compat components: forwards aria /
 * legacy-a11y / event / behavioral props to the rendered element. The press
 * family mirrors Tamagui web exactly (onPress → click firing onPress +
 * onLongPress, pressIn/Out → the mouse AND touch pairs, disabled detaching
 * the composed interaction surface). The hover family deliberately diverges:
 * onHoverIn/onHoverOut ride the pointer pair — the platform's ONE hover seam,
 * with the touch anti-flicker filter, per #37920's design — where Tamagui web
 * wires mouseenter/mouseleave; the divergence is pinned by dom.test.tsx and
 * the event-parity gate. A component supplies only how to compute its
 * className; `createCompatComponent` wires the rest.
 */
import * as React from 'react'
import { isTouchPointerEvent } from '../styled/styled'
import { type CompatEmission, mergeCompatStyle } from './compose'
import { domTestId } from './dom-test-id'
import { markMyceliumPrimitive } from './primitive-marker'
import type {
  CompatAnimationProps,
  CompatAriaProps,
  CompatBehavioralProps,
  CompatEventProps,
  CompatLegacyA11yProps,
} from './props'
import { containUntrustedTag } from './safe-tags'

/** The prop surface the DOM wrapper reads (everything except styling). */
export type CompatDomProps = CompatAriaProps & CompatLegacyA11yProps & CompatEventProps & CompatBehavioralProps

/** RN accessibilityRole → ARIA role (the react-native-web mapping). */
const ACCESSIBILITY_ROLE_TO_ROLE: Record<string, React.AriaRole> = {
  adjustable: 'slider',
  alert: 'alert',
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  header: 'heading',
  image: 'img',
  imagebutton: 'button',
  link: 'link',
  list: 'list',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  none: 'presentation',
  progressbar: 'progressbar',
  radio: 'radio',
  radiogroup: 'radiogroup',
  scrollbar: 'scrollbar',
  search: 'searchbox',
  slider: 'slider',
  spinbutton: 'spinbutton',
  summary: 'region',
  switch: 'switch',
  tab: 'tab',
  tablist: 'tablist',
  text: 'presentation',
  timer: 'timer',
  toolbar: 'toolbar',
}

// Keep in sync with `CompatAriaProps` (compat/props.ts): a key typed there but
// missing here type-checks at the call site and then renders without the
// attribute, since forwarding is an allow-list and JSX spreads aren't excess-checked.
export const ARIA_PROP_KEYS = [
  'aria-busy',
  'aria-checked',
  'aria-controls',
  'aria-describedby',
  'aria-disabled',
  'aria-expanded',
  'aria-haspopup',
  'aria-hidden',
  'aria-invalid',
  'aria-label',
  'aria-labelledby',
  'aria-live',
  'aria-modal',
  'aria-selected',
  'aria-valuemax',
  'aria-valuemin',
  'aria-valuenow',
  'aria-valuetext',
] as const

/**
 * Handlers Tamagui consumes into its composed interaction surface (re-emitted
 * from its own hover/focus wiring) — so, like the onPress family, they are
 * detached when `disabled` is set. `onMouseEnter`/`onMouseLeave` are plain
 * pass-throughs here (in Tamagui they merge into its composed hover handlers,
 * which fire on the same mouseenter/mouseleave — observably identical);
 * `onMouseDown`/`onMouseUp` are NOT in this list because they ride the press
 * pairs below (Tamagui merges them into its composed pressIn/pressOut
 * handlers, attached to both the mouse and touch slots).
 */
const TAMAGUI_COMPOSED_EVENT_PROPS = ['onMouseEnter', 'onMouseLeave', 'onFocus', 'onBlur'] as const

/**
 * Raw DOM handlers Tamagui passes through untouched (attached even when
 * disabled). This includes onPointerDown/onPointerUp: createComponent's prop
 * destructuring only pulls out the press/mouse/hover/focus family, pointer
 * handlers are not in getWebEvents and not in skipProps, so getSplitStyles
 * routes them into viewProps and they reach the DOM element verbatim.
 * onMouseMove rides the same path (absent from getWebEvents and skipProps) —
 * and Base UI's TooltipTrigger hover-open with asChild depends on it reaching
 * the element, so dropping it silently kills asChild tooltip triggers.
 */
const FORWARDED_EVENT_PROPS = [
  'onMouseMove',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerDown',
  'onPointerUp',
  'onPointerMove',
  'onPointerCancel',
  'onPointerEnterCapture',
  'onPointerLeaveCapture',
  'onPointerDownCapture',
  'onPointerUpCapture',
  'onPointerMoveCapture',
  'onPointerCancelCapture',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
  'onTouchEndCapture',
  'onPointerOut',
  // No Tamagui composed equivalent at all (not web-events, not skipProps):
  // plain raw DOM handlers a caller wires directly to the rendered element.
  'onScroll',
  'onKeyDown',
  'onAnimationEnd',
  'onTransitionEnd',
] as const

type PressPairHandler = (event: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => void

/**
 * Wires one composed press pair the way Tamagui web does (`getWebEvents` in
 * @tamagui/web createComponent.js): the user's pressIn/pressOut handler and
 * any raw onMouseDown/onMouseUp merge into ONE composed handler attached to
 * BOTH the mouse slot and the touch slot, with no touch→mouse double-fire
 * guard — Tamagui has none either (INFRA-3292: pointerdown fires before
 * mousedown, so the previous pointer mapping broke
 * `onPressIn={e => e.stopPropagation()}` shields).
 *
 * The attach gate is truthiness-based like Tamagui's `attachPress`
 * (`!!(... || onPressIn || onMouseDown || ...)`, createComponent.js:477) — a
 * runtime `onPressIn={null}` must NOT attach a no-op composed handler, which
 * would otherwise clobber a raw `onTouchStart` below.
 */
function wirePressPair(args: {
  out: Record<string, unknown>
  press: PressPairHandler | null | undefined
  mouse: PressPairHandler | null | undefined
  mouseSlot: 'onMouseDown' | 'onMouseUp'
  touchSlot: 'onTouchStart' | 'onTouchEnd'
}): void {
  const { out, press, mouse, mouseSlot, touchSlot } = args
  if (!press && !mouse) {
    return
  }
  const handler: PressPairHandler = (event) => {
    press?.(event)
    mouse?.(event)
  }
  out[mouseSlot] = handler
  out[touchSlot] = handler
}

/**
 * Wires the composed interaction surface (everything Tamagui detaches when
 * `disabled` is set): the click handler, the press pairs, the hover seam, and
 * the mouse-enter/focus passthroughs.
 *
 * PRESS mirrors Tamagui web exactly — see wirePressPair and the click gate
 * below. HOVER deliberately diverges: onHoverIn/onHoverOut bind the pointer
 * pair (ONE hover seam per platform, the same seam the styled() factory
 * binds, with the touch anti-flicker filter — #37920's design) where Tamagui
 * web binds composed mouseenter/mouseleave behind its `attachHover ||
 * attachPress` gate. Compat has NO hover attach gate: a lone
 * onHoverIn/onHoverOut always attaches (Tamagui would drop a lone one), and
 * the runtimeHoverStyle/runtimePressStyle limbs of Tamagui's gate are
 * subsumed — hoverStyle/pressStyle compile to CSS and never gate event
 * attachment here. Pinned as a documented divergence in dom.test.tsx and the
 * event-parity gate (event-parity.test.tsx).
 */
function wireComposedInteractions(out: Record<string, unknown>, props: CompatDomProps): void {
  const { onPress, onLongPress, onClick } = props
  // Truthiness gate like Tamagui's `attachPress` (createComponent.js:477) —
  // a runtime `onPress={null}` must NOT attach a no-op click handler. A raw
  // `onClick` merges into the composed handler in Tamagui's compose order
  // (`onClick?.(e), onPress?.(e), onLongPress?.(e)`, the composed onPress in
  // createComponent.js); Tamagui web has no long-press timing: this click
  // handler invokes onPress and onLongPress together.
  if (onPress || onLongPress || onClick) {
    out['onClick'] = (event: React.MouseEvent<HTMLElement>): void => {
      onClick?.(event)
      onPress?.(event)
      onLongPress?.(event)
    }
  }
  wirePressPair({
    out,
    press: props.onPressIn,
    mouse: props.onMouseDown,
    mouseSlot: 'onMouseDown',
    touchSlot: 'onTouchStart',
  })
  wirePressPair({
    out,
    press: props.onPressOut,
    mouse: props.onMouseUp,
    mouseSlot: 'onMouseUp',
    touchSlot: 'onTouchEnd',
  })
  // ONE hover seam per platform: web hover is the pointer pair — the same
  // seam the styled() factory binds — never a second mouse-event channel.
  // (Tamagui web used mouseenter/leave; pointerenter/leave fires for the
  // same interactions and additionally carries pointerType, which the
  // touch filter below needs. A raw onPointerEnter/onPointerLeave the
  // caller also passes is chained after the hover handler below.)
  // Truthiness gates like the press pairs' attachPress: a runtime
  // onHoverIn={null} must NOT attach a wrapper that would invoke null on
  // the first non-touch pointerenter.
  if (props.onHoverIn) {
    const { onHoverIn } = props
    // Same touch filter as the factory seam (styled.tsx): touch taps fire
    // pointerenter, but legacy hover styles never applied on touch, so a
    // tap must not flicker hover. Leave stays unfiltered — always resetting
    // means a filtered enter can never strand stale hover state.
    out['onPointerEnter'] = (event: React.PointerEvent<HTMLElement>): void => {
      if (!isTouchPointerEvent(event)) {
        onHoverIn(event)
      }
    }
  }
  if (props.onHoverOut) {
    out['onPointerLeave'] = props.onHoverOut
  }
  for (const key of TAMAGUI_COMPOSED_EVENT_PROPS) {
    if (props[key] !== undefined) {
      out[key] = props[key]
    }
  }
}

/**
 * Translate the non-style compat surface (aria / legacy a11y / behavioral /
 * interaction props) into DOM props — the press family exactly as Tamagui web
 * forwards it (onPress → click firing onClick + onPress + onLongPress,
 * onPressIn/Out → mousedown/up + touchstart/end with the raw-mouse merge),
 * the hover family on the platform's one hover seam (onHoverIn/Out →
 * pointerenter/leave, a documented divergence from Tamagui's
 * mouseenter/leave — see wireComposedInteractions), `disabled` detaching the
 * composed interaction surface. Used by `createCompatComponent` and by compat
 * components that render a third-party element (e.g. a Base UI popup) instead
 * of their own tag but still owe the legacy prop forwarding.
 */
export function domProps(props: CompatDomProps): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  // ARIA passthrough + legacy RN accessibility mappings (react-native-web behavior).
  for (const key of ARIA_PROP_KEYS) {
    if (props[key] !== undefined) {
      out[key] = props[key]
    }
  }
  if (props.accessibilityLabel !== undefined && out['aria-label'] === undefined) {
    out['aria-label'] = props.accessibilityLabel
  }
  const role =
    props.role ??
    (props.accessibilityRole !== undefined ? ACCESSIBILITY_ROLE_TO_ROLE[props.accessibilityRole] : undefined)
  if (role !== undefined) {
    out['role'] = role
  }
  if (props.id !== undefined) {
    out['id'] = props.id
  }
  if (props.title !== undefined) {
    out['title'] = props.title
  }
  if (props.tabIndex !== undefined) {
    out['tabIndex'] = typeof props.tabIndex === 'string' ? Number(props.tabIndex) : props.tabIndex
  }
  if (props.href !== undefined) {
    out['href'] = props.href
  }
  if (props.target !== undefined) {
    out['target'] = props.target
  }
  if (props.htmlFor !== undefined) {
    out['htmlFor'] = props.htmlFor
  }
  if (props.rel !== undefined) {
    out['rel'] = props.rel
  }
  if (props.download !== undefined) {
    out['download'] = props.download
  }
  if (props.inert !== undefined) {
    out['inert'] = props.inert
  }
  if (props.dangerouslySetInnerHTML !== undefined) {
    out['dangerouslySetInnerHTML'] = props.dangerouslySetInnerHTML
  }
  // Raw `data-*` attributes pass through verbatim, like Tamagui web routes
  // unknown `data-*` JSX props into viewProps (e.g. the Progress compat's
  // data-state/value/max); `undefined` is skipped so absent attrs stay absent.
  for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
    if (key.startsWith('data-') && value !== undefined) {
      out[key] = value
    }
  }
  if (props.disabled === true) {
    out['aria-disabled'] = true
  }
  // Interaction handlers: press → click firing onClick + onPress +
  // onLongPress, pressIn/Out → mousedown/up AND touchstart/end (Tamagui's own
  // web mapping), hoverIn/Out → pointerenter/leave (the deliberate pointer
  // hover seam). `disabled` detaches this composed interaction surface
  // entirely, exactly like Tamagui web does — raw DOM handlers below still
  // pass through, matching Tamagui's untouched viewProps.
  if (props.disabled !== true) {
    wireComposedInteractions(out, props)
  }
  // Cast, not `props[key]`: a handful of these keys (onScroll) are declared
  // only on individual components' own prop types (e.g. FlexCompatOwnEventProps),
  // not on the shared CompatDomProps every createCompatComponent caller shares --
  // components that don't declare a given key simply have it read as `undefined`.
  const rawProps = props as Record<string, unknown>
  for (const key of FORWARDED_EVENT_PROPS) {
    forwardRaw({ out, key, raw: rawProps[key] })
  }
  return out
}

/**
 * Slots where a composed handler may already sit AND the raw handler must
 * still run: the hover seam's pointer pair (onHoverIn/onHoverOut claim it, and
 * the touch filter must never swallow a raw pointer handler) — chained after
 * the hover handler, neither one overwriting the other.
 */
const CHAINED_RAW_SLOTS: ReadonlySet<string> = new Set(['onPointerEnter', 'onPointerLeave'])

/**
 * Forward a raw DOM handler. An occupied slot resolves per which composed
 * surface owns it: the pointer pair CHAINS the raw handler after the hover
 * handler (see CHAINED_RAW_SLOTS), while the press pairs' touch slots
 * (onTouchStart/onTouchEnd) let the composed press surface WIN — the raw
 * handler is dropped, matching Tamagui's `Object.assign(viewProps,
 * getWebEvents(events))`. Caveat: that clobber holds when a press-family prop
 * is present; with only non-press attach-tripping props (focus, or raw
 * onMouseEnter/onMouseLeave), Tamagui's `shouldAttach` path would still
 * clobber raw onTouchStart/onTouchEnd with undefined — mycelium deliberately
 * diverges there and passes the raw handler through (see
 * event-parity.test.tsx).
 */
function forwardRaw({ out, key, raw }: { out: Record<string, unknown>; key: string; raw: unknown }): void {
  // Function-type guard, not `!== undefined`: a runtime null raw handler on a
  // chained slot must never be invoked (same hazard as the hover/press gates).
  if (typeof raw !== 'function') {
    return
  }
  const composed = out[key]
  if (typeof composed !== 'function') {
    out[key] = raw
    return
  }
  if (!CHAINED_RAW_SLOTS.has(key)) {
    return
  }
  const hover = composed as (event: unknown) => void
  const rawHandler = raw as (event: unknown) => void
  out[key] = (event: unknown): void => {
    hover(event)
    rawHandler(event)
  }
}

type OnLayout = NonNullable<CompatEventProps['onLayout']>

/**
 * react-native-web `onLayout` semantics: notify with the border-box rect
 * after mount and again whenever the element resizes. Returns a callback ref
 * to attach to the observed element (merge it with any forwarded ref).
 */
export function useOnLayout(onLayout: OnLayout | undefined): (node: HTMLElement | null) => void {
  const handlerRef = React.useRef<OnLayout | undefined>(onLayout)
  handlerRef.current = onLayout
  const cleanupRef = React.useRef<(() => void) | undefined>(undefined)
  // Keyed on handler PRESENCE so a handler arriving after mount (a conditional
  // `onLayout={enabled ? handler : undefined}` flipping on) still attaches the observer,
  // matching the legacy Tamagui layout effect keyed on `[ref, !!onLayout]` (RNW itself does
  // not re-observe on handler changes). The identity change re-runs the merged callback ref.
  const hasHandler = onLayout !== undefined
  return React.useCallback(
    (node: HTMLElement | null) => {
      cleanupRef.current?.()
      cleanupRef.current = undefined
      if (node === null || !hasHandler) {
        return
      }
      const notify = (): void => {
        const rect = node.getBoundingClientRect()
        handlerRef.current?.({
          nativeEvent: { layout: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } },
        })
      }
      if (typeof ResizeObserver === 'undefined') {
        notify()
        return
      }
      const observer = new ResizeObserver(notify)
      observer.observe(node)
      cleanupRef.current = (): void => observer.disconnect()
    },
    [hasHandler],
  )
}

/**
 * Build a web-only, drop-in compat component from an emission computer
 * (className + the inline-style lane for base-pool values outside the closed
 * emitted class set — INFRA-3217). The returned component forwards its ref
 * (merged with the `onLayout` observer ref) and renders `tag ?? 'div'` with
 * the shared DOM prop forwarding. The user `style` prop merges over the
 * computed inline styles, mirroring how it already sat above the classes.
 */
export function createCompatComponent<P extends CompatDomProps & CompatAnimationProps<unknown>>(
  computeEmission: (props: P) => CompatEmission,
  displayName: string,
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<HTMLElement>> {
  const Component = React.forwardRef<HTMLElement, P>(function CompatComponent(props, ref) {
    const { children, style, testID, tag } = props
    const layoutRef = useOnLayout(props.onLayout)
    // Merges the layout callback ref with the forwarded ref. Memoized so the
    // callback ref doesn't refire (null, node) on every render; `layoutRef` only
    // changes when onLayout presence flips, so this refires only then or when the
    // forwarded ref itself changes.
    const setRef = React.useCallback(
      (node: HTMLElement | null): void => {
        layoutRef(node)
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref !== null) {
          ref.current = node
        }
      },
      [layoutRef, ref],
    )
    // enterStyle (props.ts) mount-flip: the generic bound guarantees `P` carries
    // `enterStyle` (typed `unknown` here since the real per-component style type
    // `S` varies by caller); the object-shape assumption below is the real
    // contract documented on CompatAnimationProps.enterStyle. First paint
    // renders with enterStyle merged over the base props; releasing it one
    // macrotask later (like the setTimeout flip
    // in ui/src's AnimateInOrder.web.tsx — deliberately NOT a bare `useEffect`
    // body, which a test's `act()` would flush before any paint could occur, and
    // NOT `requestAnimationFrame`, which can fire before the entering frame's own
    // paint) lets that first paint actually land, and an explicit `transition`
    // the element already declares then carries the visual delta to the base
    // style — no keyframe generation; `animation` alone does NOT (see
    // CompatAnimationProps.enterStyle in props.ts for that and the base-pool
    // precedence caveat). Identity values (`enterStyle={{ x: 0 }}` next to
    // `x={0}`) have zero delta, so the release is visually silent, which is
    // the whole point.
    const enterStyle = props.enterStyle as Record<string, unknown> | undefined
    const hasEnterStyle = enterStyle !== undefined
    const [hasEntered, setHasEntered] = React.useState(() => !hasEnterStyle)
    React.useEffect(() => {
      if (!hasEnterStyle) {
        return undefined
      }
      const timer = setTimeout(() => setHasEntered(true), 0)
      return () => clearTimeout(timer)
    }, [hasEnterStyle])
    const emissionProps = hasEntered || !hasEnterStyle ? props : { ...props, ...enterStyle }
    // forwardRef types the render prop as PropsWithoutRef<P>; the compiler
    // owns the ref, so the style-bearing shape is still P.
    const emission = computeEmission(emissionProps as P)
    const mergedStyle = mergeCompatStyle(emission.style, style)
    const forwardedDomProps = domProps(props)
    const resolvedTag = containUntrustedTag(tag, forwardedDomProps)
    return React.createElement(
      resolvedTag,
      {
        ...forwardedDomProps,
        ref: setRef,
        className: emission.className,
        ...domTestId(testID),
        style: mergedStyle,
      },
      children,
    )
  })
  Component.displayName = displayName
  // Opts every compat primitive out of the legacy wrappers' color injection
  // (see primitive-marker.ts): injected legacy tokens like the `$accent3`
  // default sit on the rejected side of the colour boundary and would throw
  // in the emission compiler.
  return markMyceliumPrimitive(Component)
}
