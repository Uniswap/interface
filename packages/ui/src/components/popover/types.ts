import type { CSSProperties, ReactNode, Ref } from 'react'

/**
 * Prop contracts for the rebuilt, Tamagui-free Popover (INFRA-3318): the slice of the
 * legacy Tamagui `Popover` compound surface (Root / Trigger / Anchor / Content / Close /
 * Arrow / Adapt) that repo call sites actually exercise, kept import-compatible under
 * the same `ui/src` exports.
 *
 * Shared by all three platform legs — no react-native or DOM-runtime imports here.
 */

export type PopoverPlacementSide = 'top' | 'bottom' | 'left' | 'right'

/** The floating-ui placement vocabulary the legacy Tamagui popper accepted. */
export type PopoverPlacement = PopoverPlacementSide | `${PopoverPlacementSide}-start` | `${PopoverPlacementSide}-end`

/** floating-ui offset middleware shape the legacy popper accepted. */
export type PopoverOffset = number | { mainAxis?: number; crossAxis?: number }

/** How an open-state change was initiated (legacy `onOpenChange` second argument). */
export type PopoverVia = 'hover' | 'press'

/**
 * The `useHover` slice of the legacy `hoverable` prop repo call sites drive
 * (`delay`/`restMs`/`move`); other floating-ui knobs are accepted-inert.
 */
export type PopoverHoverableProps =
  | boolean
  | {
      delay?: number | { open?: number; close?: number }
      restMs?: number
      move?: boolean
      [key: string]: unknown
    }

/**
 * The imperative handle the legacy `Popover` exposed through its ref (type/value
 * merge: `useRef<Popover>` at call sites types this handle).
 */
export type PopoverImperativeHandle = {
  anchorTo: (rect: { x: number; y: number; width: number; height: number }) => void
  toggle: () => void
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

/**
 * Root props. Fully controlled when `open` is set, uncontrolled press/hover
 * toggling otherwise — exactly like the legacy `Popover`.
 */
export interface PopoverProps {
  children?: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean, via?: PopoverVia) => void
  placement?: PopoverPlacement
  /** floating-ui offset; when omitted the legacy popper fell back to the registered arrow size. */
  offset?: PopoverOffset
  /**
   * Shift-into-viewport collision handling. The legacy popover default is ON
   * (`stayInFrame: true` in the Tamagui root); an object accepted the floating-ui
   * shift options (`{ padding }` at repo call sites).
   */
  stayInFrame?: boolean | { padding?: number | Partial<Record<PopoverPlacementSide, number>> }
  /** Flip-to-opposite-side collision handling (legacy floating-ui flip middleware, default OFF). */
  allowFlip?: boolean | Record<string, unknown>
  /** floating-ui positioning strategy → CSS position of the floating element. */
  strategy?: 'absolute' | 'fixed'
  /** Open on trigger hover; object form carries floating-ui `useHover` timing. */
  hoverable?: PopoverHoverableProps
  /** Accepted-inert legacy mount-lifecycle knob (no repo call sites drive it). */
  keepChildrenMounted?: boolean | 'lazy'
  /** Accepted-inert legacy focus knob (no repo call sites drive it). */
  disableFocus?: boolean
  ref?: Ref<PopoverImperativeHandle>
}

/**
 * The style-prop bag legacy call sites pass to the Popover parts (Tamagui stack
 * props). Tokens (`$spacing12`, `$rounded12`, `$surface1`, …) resolve to concrete
 * theme values per platform leg.
 */
export interface PopoverFrameStyleProps {
  backgroundColor?: string
  /** Tamagui alias for backgroundColor (SendRecipientForm passes `background`). */
  background?: string
  borderColor?: string
  borderWidth?: number | string
  borderRadius?: number | string
  width?: number | string
  height?: number | string
  minWidth?: number | string
  minHeight?: number | string
  maxWidth?: number | string
  maxHeight?: number | string
  flex?: number
  flexDirection?: CSSProperties['flexDirection']
  alignItems?: CSSProperties['alignItems']
  justifyContent?: CSSProperties['justifyContent']
  alignSelf?: CSSProperties['alignSelf']
  gap?: number | string
  rowGap?: number | string
  columnGap?: number | string
  position?: 'absolute' | 'relative'
  top?: number | string
  bottom?: number | string
  left?: number | string
  right?: number | string
  display?: CSSProperties['display']
  overflow?: CSSProperties['overflow']
  opacity?: number
  cursor?: string
  pointerEvents?: 'auto' | 'none' | 'box-none'
  p?: number | string
  px?: number | string
  py?: number | string
  pt?: number | string
  pb?: number | string
  pl?: number | string
  pr?: number | string
  padding?: number | string
  paddingHorizontal?: number | string
  paddingVertical?: number | string
  paddingLeft?: number | string
  paddingRight?: number | string
  paddingTop?: number | string
  paddingBottom?: number | string
  m?: number | string
  mx?: number | string
  my?: number | string
  ml?: number | string
  mr?: number | string
  mt?: number | string
  mb?: number | string
  margin?: number | string
  marginHorizontal?: number | string
  marginVertical?: number | string
  marginLeft?: number | string
  marginRight?: number | string
  marginTop?: number | string
  marginBottom?: number | string
  /**
   * RN shadow surface. Typed loose (`unknown`) because legacy call sites spread
   * `useShadowProps*()` bags whose values are Tamagui theme types
   * (`GetThemeValueForKey` variables, `'unset'`); the resolver narrows at runtime
   * (string / `{ val }` variable → color, numeric width/height offsets, numbers).
   */
  shadowColor?: unknown
  shadowOffset?: unknown
  shadowOpacity?: unknown
  shadowRadius?: unknown
  /** Legacy Tamagui platform gate: applied verbatim on web, ignored elsewhere. */
  '$platform-web'?: CSSProperties
}

/**
 * The eleven desktop-first media keys (`ui/src/theme/media.ts`) accepted as
 * style-override props, least-strong first — later keys win where both match,
 * like the legacy Tamagui media precedence.
 */
export type PopoverMediaStyleProps = {
  $xxxl?: PopoverFrameStyleProps
  $xxl?: PopoverFrameStyleProps
  $xl?: PopoverFrameStyleProps
  $lg?: PopoverFrameStyleProps
  $md?: PopoverFrameStyleProps
  $sm?: PopoverFrameStyleProps
  $xs?: PopoverFrameStyleProps
  $xxs?: PopoverFrameStyleProps
  $short?: PopoverFrameStyleProps
  $midHeight?: PopoverFrameStyleProps
  $lgHeight?: PopoverFrameStyleProps
}

/** Legacy enter/exit presence style: the slice repo call sites pass (y/scale/opacity slides + fades). */
export interface PopoverPresenceStyle {
  x?: number
  y?: number
  scale?: number
  opacity?: number
  transform?: Array<{ translateY?: number; translateX?: number; scale?: number }>
  [key: string]: unknown
}

export interface PopoverContentProps extends PopoverFrameStyleProps, PopoverMediaStyleProps {
  children?: ReactNode
  /**
   * Accepted-inert legacy Tamagui animation config: the rebuilt web leg drives a fixed
   * 150ms transform/opacity transition from `enterStyle`/`exitStyle` instead.
   */
  animation?: unknown
  animateOnly?: string[]
  /** Legacy presence styles — mapped onto the web leg's starting/ending transition styles. */
  enterStyle?: PopoverPresenceStyle
  exitStyle?: PopoverPresenceStyle
  /**
   * Legacy FocusScope surface. `trapFocus ?? open` holds on web: the trap defaults ON
   * while open (Base UI `modal="trap-focus"`, armed by the Content's hidden registered
   * close part) and `trapFocus={false}` / `disableFocusScope` opt out; Base UI skips
   * the focus manager entirely for hover-opened popups. The auto-focus handlers are
   * wired.
   */
  trapFocus?: boolean
  disableFocusScope?: boolean
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: ((event: Event) => void) | false
  /** Legacy Dismissable interceptors: run before a close request commits; preventDefault swallows it. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: CustomEvent<{ originalEvent: PointerEvent }>) => void
  onFocusOutside?: (event: CustomEvent<{ originalEvent: FocusEvent }>) => void
  onInteractOutside?: (
    event: CustomEvent<{ originalEvent: PointerEvent }> | CustomEvent<{ originalEvent: FocusEvent }>,
  ) => void
  /** Accepted-inert legacy knobs (scroll locking stays with the hosting layer; Base UI owns mount lifecycle). */
  enableRemoveScroll?: boolean
  freezeContentsWhenHidden?: boolean
  lazyMount?: boolean
  /** Accepted-inert Tamagui ThemeableStack variant (drop shadows come from explicit shadow props). */
  elevate?: boolean
  /**
   * Escape hatch for the stacking layer (number or `$`-token into `zIndexes`). When
   * omitted, Content reads EffectiveModalOrSheetZIndexContext and renders one layer
   * above its closest modal/sheet ancestor (floor: `zIndexes.popover`).
   */
  zIndex?: number | string
  testID?: string
  'data-testid'?: string
  id?: string
  role?: string
  // Method syntax on purpose: bivariant parameters, so legacy call-site handlers
  // typed against their own event shapes stay assignable (the Tamagui surface was
  // similarly permissive).
  onPress?(this: void, event?: unknown): void
  onPressIn?(this: void, event?: unknown): void
  onPressOut?(this: void, event?: unknown): void
  ref?: Ref<HTMLElement>
}

export interface PopoverTriggerProps extends PopoverFrameStyleProps {
  children?: ReactNode
  /** Render the child element itself as the trigger, like Tamagui `asChild`. */
  asChild?: boolean
  /** Disable the trigger interaction (legacy Tamagui stack `disabled`). */
  disabled?: boolean
  testID?: string
  'data-testid'?: string
  onPress?(this: void, event?: unknown): void
  onMouseDown?(this: void, event?: unknown): void
  onContextMenu?(this: void, event?: unknown): void
  /** Web only: replace the wrapper's default `role="button"` / `tabIndex=0` when the child is the interactive element. */
  role?: string
  tabIndex?: number
  ref?: Ref<HTMLElement>
}

export interface PopoverAnchorProps extends PopoverFrameStyleProps {
  children?: ReactNode
  ref?: Ref<HTMLElement>
}

export interface PopoverCloseProps extends PopoverFrameStyleProps {
  children?: ReactNode
  /** Clone the child element as the close control, like Tamagui `asChild`. */
  asChild?: boolean
  testID?: string
  onPress?(this: void, event?: unknown): void
  ref?: Ref<HTMLElement>
}

export interface PopoverArrowProps extends PopoverFrameStyleProps {
  children?: ReactNode
  /**
   * Arrow size token/number. The legacy popper stepped tokens TWO sizes down the
   * space scale (`getSpace(size, { shift: -2 })`) — pinned in shared.ts so the
   * rendered size matches the legacy artifact exactly.
   */
  size?: number | string
  /** Accepted-inert legacy popper knob. */
  offset?: number
  unstyled?: boolean
}

/** `when` accepts a boolean or one of the media keys (`'sm'`, …) like the legacy Adapt. */
export type PopoverAdaptWhen =
  | boolean
  | 'xxxl'
  | 'xxl'
  | 'xl'
  | 'lg'
  | 'md'
  | 'sm'
  | 'xs'
  | 'xxs'
  | 'short'
  | 'midHeight'
  | 'lgHeight'

export interface PopoverAdaptProps {
  when?: PopoverAdaptWhen
  children?: ReactNode
}

export interface PopoverAdaptContentsProps {
  children?: ReactNode
}
