/**
 * The popover-compat prop contracts (INFRA-3021): the legacy
 * `AdaptiveWebPopoverContent` surface — which leaks the full Tamagui
 * `Popover.Content` prop surface — reproduced without the Tamagui runtime.
 * The style surface reuses the Flex compat contract (Popover.Content is a
 * YStack); the Popover-specific plumbing is accepted explicitly below. The
 * parity suite in `packages/tailwind/src/parity/popover` asserts key coverage
 * against the real legacy component up to a documented exclusion list.
 */
import type * as React from 'react'
import type { FlexCompatProps } from '../flex-compat/props'
import type { PopoverCompatHoverableProps } from './hover'
import type { PopoverCompatOffset, PopoverCompatPlacement } from './position'

export type { PopoverCompatHoverableProps }
export type { PopoverCompatOffset, PopoverCompatPlacement }

/**
 * Structural replica of the legacy `webBottomSheetProps` surface —
 * `Omit<ComponentProps<typeof WebBottomSheet>, 'children' | 'isOpen'>`, where
 * `WebBottomSheet` takes the file-local web `ModalProps` of
 * `ui/src/components/modal/AdaptiveWebModal.tsx`: `GetProps<typeof View>`
 * (the leaked Tamagui View style surface, covered here by the Flex compat
 * contract) plus the explicit web-sheet knobs below. NOT the React Native
 * `uniswap/src/components/modals/ModalProps.tsx` contract — the web sheet
 * never accepted those native-only keys. Mapped directly onto the mycelium
 * `WebBottomSheet` (INFRA-3329, `@universe/mycelium/web-bottom-sheet-compat`)
 * by `AdaptiveWebPopoverContentCompat`'s sheet leg. The parity suite pins key
 * coverage with a nested UncoveredKeys check plus the live call-site shapes
 * (see `parity/popover/type-parity.ts`).
 */
export type WebBottomSheetCompatProps = Omit<FlexCompatProps, 'children'> & {
  onClose?: () => void
  /** Legacy default true: adapt into a bottom sheet on small viewports. */
  adaptToSheet?: boolean
  alignment?: 'center' | 'top'
  hideHandlebar?: boolean
  snapPointsMode?: 'percent' | 'constant' | 'fit' | 'mixed' | (string & {})
  snapPoints?: ReadonlyArray<string | number> | Array<string | number> | null
  overlayOpacity?: number
  /** Skips the legacy sheet's built-in RemoveScroll for self-locking callers. */
  disableRemoveScroll?: boolean
}

/**
 * Tamagui Popover.Content plumbing accepted for drop-in compatibility but
 * inert on the Base UI engine (each documented in the popover parity
 * exclusions ledger): focus scoping is handled by Base UI (`trapFocus` off by
 * default matches legacy), scroll locking belongs to the hosting layer, and
 * the lazy-mount/unmount knobs are Base UI defaults already.
 */
export interface PopoverContentInertProps {
  /** Inert: Base UI popovers do not trap focus by default, matching the legacy default. */
  trapFocus?: boolean
  /** Inert: scroll locking stays with the hosting layer (legacy default is false). */
  enableRemoveScroll?: boolean
  /** Inert: Base UI repositions without remount; the legacy flag opted into animated repositioning. */
  enableAnimationForPositionChange?: boolean
  /** Inert: the compat popup frame mirrors the Tamagui `size`-variant defaults; per-call sizes go through style props. */
  size?: string | number
  /** Inert: the compat popup frame is the styled (non-headless) variant, like the app-wide default. */
  unstyled?: boolean
  /** Inert: Base UI portals mount lazily already. */
  lazyMount?: boolean
  /** Inert: Base UI unmounts closed popups already. */
  unmountChildrenWhenHidden?: boolean
  /** Inert: Tamagui popper flip tuning; Base UI collision avoidance flips by default. */
  flipStyle?: string
  /** Inert: Tamagui arrow plumbing — the legacy AdaptiveWebPopoverContent renders no arrow. */
  arrowBorderColor?: string
  arrowBorderWidth?: number
  /** Inert: Tamagui keeps the closed popup mounted; Base UI owns mount lifecycle (plumbing, no call sites). */
  forceMount?: boolean
  /** Inert: Tamagui Dismissable unmount override (plumbing, no call sites). */
  forceUnmount?: boolean
  /** Inert: Tamagui content-freeze optimization while hidden (plumbing, no call sites). */
  freezeContentsWhenHidden?: boolean
}

/**
 * Tamagui ThemeableStack styled() variant shorthands leaked through
 * Popover.Content. Accepted with the legacy value types but INERT — the only
 * production call site is CreateNewTokenForm's `elevate` (its drop shadow
 * moves to explicit shadow style props at conversion); every other key has
 * zero call sites (grep 2026-07-27). Ledgered ("Styled variant shorthands").
 */
export interface PopoverContentStyledVariantProps {
  bordered?: boolean | number
  circular?: boolean
  hoverTheme?: boolean
  pressTheme?: boolean
  focusTheme?: boolean
  elevate?: boolean
  elevation?: number | (string & {})
  transparent?: boolean
  padded?: boolean
  radiused?: boolean
  fullscreen?: boolean
}

/** Structural twin of the Tamagui Dismissable outside events (CustomEvent detail carries the original). */
export type PopoverCompatPointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>
export type PopoverCompatFocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>

/**
 * The legacy FocusScope / Dismissable surface, WIRED onto Base UI popup
 * behavior (not accepted-inert — these are load-bearing a11y hooks in
 * production: RecentlyConnectedModal moves focus to its login button on
 * open, SendRecipientForm and BalanceBreakdownPopover suppress focus
 * stealing):
 * - `onOpenAutoFocus` / `onCloseAutoFocus` map onto Base UI
 *   `initialFocus`/`finalFocus`: the compat fires the callback with a
 *   cancelable event; preventDefault (or `onCloseAutoFocus: false`) keeps
 *   focus where it is, otherwise Base UI's default focus move runs. With
 *   neither provided the compat keeps the legacy no-focus-move default.
 * - `disableFocusScope` forces both off, like the legacy FocusScope bypass.
 * - The dismissal interceptors (`onEscapeKeyDown`, `onPointerDownOutside`,
 *   `onFocusOutside`, `onInteractOutside`) run before a Base UI close
 *   request is forwarded to the host; preventDefault swallows the request
 *   (fully-controlled pattern — see the exclusions ledger for the
 *   uncontrolled caveat).
 * - `onFocusCapture`/`onBlurCapture` forward to the popup element.
 */
export interface PopoverContentFocusScopeCompatProps {
  onOpenAutoFocus?: (event: Event) => void
  onCloseAutoFocus?: ((event: Event) => void) | false
  disableFocusScope?: boolean
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PopoverCompatPointerDownOutsideEvent) => void
  onFocusOutside?: (event: PopoverCompatFocusOutsideEvent) => void
  onInteractOutside?: (event: PopoverCompatPointerDownOutsideEvent | PopoverCompatFocusOutsideEvent) => void
  onFocusCapture?: React.FocusEventHandler<HTMLDivElement>
  onBlurCapture?: React.FocusEventHandler<HTMLDivElement>
}

/** The adaptive props the legacy component adds on top of Popover.Content. */
export interface AdaptiveWebPopoverContentOwnProps {
  children: React.ReactNode
  isOpen: boolean
  /** If true, always render as bottom sheet regardless of screen size. */
  isSheet?: boolean
  /** Overrides the default `media.sm` adapt condition. */
  adaptWhen?: boolean
  /** Placement of the popover relative to the trigger; drives the enter/exit animation direction. */
  placement?: PopoverCompatPlacement
  webBottomSheetProps?: WebBottomSheetCompatProps
}

/**
 * The full compat surface: the legacy component's own props + the leaked
 * Tamagui Popover.Content surface (YStack style props via the Flex compat
 * contract + the popover plumbing above). `zIndex` and `children` are managed
 * by the compat exactly like the legacy component omits them.
 */
export type AdaptiveWebPopoverContentCompatProps = Omit<FlexCompatProps, 'children' | 'zIndex'> &
  PopoverContentInertProps &
  PopoverContentStyledVariantProps &
  PopoverContentFocusScopeCompatProps &
  AdaptiveWebPopoverContentOwnProps

/** The popover root surface the compat supports (the subset consumers drive today). */
export interface PopoverCompatRootProps {
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: PopoverCompatPlacement
  offset?: PopoverCompatOffset
  /** When false, collision avoidance is disabled (legacy `allowFlip` default: on). */
  allowFlip?: boolean
  /** floating-ui strategy → Base UI positionMethod. */
  strategy?: 'absolute' | 'fixed'
  /** Accepted-inert: legacy `stayInFrame` maps to Base UI's default collision handling. */
  stayInFrame?: boolean | Record<string, unknown>
  /**
   * Open on trigger hover; the object form carries floating-ui `useHover`
   * timing (`delay`/`restMs`), wired onto the Base UI trigger's
   * `openOnHover`/`delay`/`closeDelay`. Click/tap-open stays.
   */
  hoverable?: PopoverCompatHoverableProps
}

export interface PopoverCompatTriggerProps {
  'aria-label'?: string
  children?: React.ReactNode
  className?: string
  /**
   * Forwarded to the rendered trigger element, like the legacy Tamagui
   * trigger (`TamaguiElement` = `HTMLElement` on web) — consumers hold a
   * `RefObject<HTMLElement | null>` to measure the trigger (e.g. viewport-
   * constrained dropdown heights), so this is deliberately not `HTMLDivElement`.
   */
  ref?: React.Ref<HTMLElement>
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void
}
