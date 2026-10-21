/**
 * Web-only, drop-in stand-ins for the legacy Tamagui `Popover` root/trigger
 * pair, rendering on Base UI (`@base-ui/react/popover`) instead of the
 * Tamagui popper (INFRA-3021). The root carries the Tamagui positioning
 * vocabulary (placement / floating-ui offset / allowFlip / strategy) in a
 * context that `AdaptiveWebPopoverContentCompat` maps onto Base UI anchor
 * positioning. Fully controlled when `open` is set — Base UI only *requests*
 * closes through `onOpenChange`, exactly like the legacy popover.
 *
 * Dismissal interception: the content registers the legacy Dismissable
 * handlers (`onEscapeKeyDown` / `onPointerDownOutside` / `onFocusOutside` /
 * `onInteractOutside`) here; the root runs them BEFORE forwarding a Base UI
 * close request to the host, and a preventDefault swallows the request —
 * the legacy "prevent dismiss" contract on the controlled pattern.
 *
 * The parity suite in `packages/tailwind/src/parity/popover` pins the
 * behavior contract.
 */
import * as React from 'react'
import { cn } from '../cn'
import { Popover as PopoverRecipe, PopoverTrigger as PopoverRecipeTrigger } from '../shadcn/popover'
import { mapHoverableToDelays, type PopoverCompatHoverDelays } from './hover'
import type {
  PopoverCompatFocusOutsideEvent,
  PopoverCompatOffset,
  PopoverCompatPlacement,
  PopoverCompatPointerDownOutsideEvent,
  PopoverCompatRootProps,
  PopoverCompatTriggerProps,
  PopoverContentFocusScopeCompatProps,
} from './props'

export interface PopoverCompatPositionContextValue {
  placement?: PopoverCompatPlacement
  offset?: PopoverCompatOffset
  allowFlip?: boolean
  strategy?: 'absolute' | 'fixed'
}

export const PopoverCompatPositionContext = React.createContext<PopoverCompatPositionContextValue>({})

/** The Dismissable-handler subset the content registers for close-request interception. */
export type PopoverCompatDismissInterceptors = Pick<
  PopoverContentFocusScopeCompatProps,
  'onEscapeKeyDown' | 'onPointerDownOutside' | 'onFocusOutside' | 'onInteractOutside'
>

/**
 * Root → trigger/content plumbing, collapsed into one internal provider.
 * Admission criterion: root-owned plumbing for the root's single
 * trigger/content pair only — anything else gets its own context, this is
 * not an ambient state bag.
 * - `dismissInterceptorsRef`: mutable registration slot written by the content
 *   (there is exactly one content per legacy popover root);
 * - `triggerElement`/`setTriggerElement`: the trigger's DOM element as root
 *   STATE, read by the content to find a focus-trapping host via closest()
 *   (SWAP-3309). State, not a ref: an uncontrolled open (`defaultOpen`,
 *   hover) re-renders nothing above the popup, so the trigger's mount itself
 *   must re-render the content with the element already set;
 * - `hover`: the legacy `hoverable` mapping the trigger spreads onto the Base
 *   UI trigger (`openOnHover`/`delay`/`closeDelay`), like the rebuilt ui/src
 *   web leg.
 * Null outside a compat root — a standalone content then has nothing to
 * intercept and no host to discover. `PopoverCompatPositionContext` stays a
 * separate context: it is package-public with its own native leg.
 */
export interface PopoverCompatInternals {
  dismissInterceptorsRef: React.MutableRefObject<PopoverCompatDismissInterceptors | null>
  triggerElement: HTMLElement | null
  setTriggerElement: (element: HTMLElement | null) => void
  hover: PopoverCompatHoverDelays
}

export const PopoverCompatInternalsContext = React.createContext<PopoverCompatInternals | null>(null)

interface CloseRequestDetails {
  reason?: string
  event?: Event
  cancel?: () => void
}

/**
 * Run the registered interceptors for one Base UI close request. Returns
 * true when the request must be swallowed (a handler called preventDefault).
 * Events mirror the legacy Dismissable payloads: the escape handler gets a
 * cancelable KeyboardEvent; the outside handlers get cancelable CustomEvents
 * carrying the original event in `detail.originalEvent`.
 */
function runDismissInterceptors(interceptors: PopoverCompatDismissInterceptors, details: CloseRequestDetails): boolean {
  if (details.reason === 'escape-key' && interceptors.onEscapeKeyDown !== undefined) {
    const original = details.event
    const synthetic = new KeyboardEvent('keydown', {
      key: original instanceof KeyboardEvent ? original.key : 'Escape',
      cancelable: true,
    })
    interceptors.onEscapeKeyDown(synthetic)
    return synthetic.defaultPrevented
  }
  if (
    details.reason === 'outside-press' &&
    (interceptors.onPointerDownOutside !== undefined || interceptors.onInteractOutside !== undefined)
  ) {
    const synthetic = new CustomEvent('dismissable.pointerDownOutside', {
      cancelable: true,
      detail: { originalEvent: details.event },
    }) as PopoverCompatPointerDownOutsideEvent
    interceptors.onPointerDownOutside?.(synthetic)
    interceptors.onInteractOutside?.(synthetic)
    return synthetic.defaultPrevented
  }
  if (
    details.reason === 'focus-out' &&
    (interceptors.onFocusOutside !== undefined || interceptors.onInteractOutside !== undefined)
  ) {
    const synthetic = new CustomEvent('dismissable.focusOutside', {
      cancelable: true,
      detail: { originalEvent: details.event },
    }) as PopoverCompatFocusOutsideEvent
    interceptors.onFocusOutside?.(synthetic)
    interceptors.onInteractOutside?.(synthetic)
    return synthetic.defaultPrevented
  }
  return false
}

function PopoverCompatRoot({
  children,
  open,
  defaultOpen,
  onOpenChange,
  placement,
  offset,
  allowFlip,
  strategy,
  hoverable,
}: PopoverCompatRootProps): React.JSX.Element {
  const dismissInterceptorsRef = React.useRef<PopoverCompatDismissInterceptors | null>(null)
  // State, not a ref: the one extra subtree re-render on trigger mount is the
  // structural guarantee that the content sees the element before any open —
  // an uncontrolled open (`defaultOpen`, hover) re-renders nothing above the
  // popup, so a ref read at the content's last render would pin `null` and
  // portal the first open to document.body (SWAP-3309).
  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null)
  const onOpenChangeRef = React.useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange

  const handleOpenChange = React.useCallback((next: boolean, eventDetails?: CloseRequestDetails): void => {
    if (!next) {
      const interceptors = dismissInterceptorsRef.current
      if (interceptors !== null && eventDetails !== undefined && runDismissInterceptors(interceptors, eventDetails)) {
        // Legacy prevent-dismiss: swallow the request (and stop Base UI's own
        // handling where it exposes a cancel).
        eventDetails.cancel?.()
        return
      }
    }
    onOpenChangeRef.current?.(next)
  }, [])

  const position = React.useMemo(
    () => ({ placement, offset, allowFlip, strategy }),
    [placement, offset, allowFlip, strategy],
  )
  const { openOnHover, openDelayMs, closeDelayMs } = mapHoverableToDelays(hoverable)
  const internals = React.useMemo(
    () => ({
      dismissInterceptorsRef,
      triggerElement,
      setTriggerElement,
      hover: { openOnHover, openDelayMs, closeDelayMs },
    }),
    [triggerElement, openOnHover, openDelayMs, closeDelayMs],
  )
  return (
    <PopoverRecipe
      open={open}
      defaultOpen={defaultOpen}
      // Always attached: the interceptors must run for uncontrolled popovers
      // too (details.cancel() stops Base UI's own close there).
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <PopoverCompatInternalsContext.Provider value={internals}>
        <PopoverCompatPositionContext.Provider value={position}>{children}</PopoverCompatPositionContext.Provider>
      </PopoverCompatInternalsContext.Provider>
    </PopoverRecipe>
  )
}

/**
 * Renders a plain `div` wrapper like the Tamagui trigger stack (not a native
 * button) so arbitrary trigger content keeps its own semantics; Base UI wires
 * the open interaction and aria attributes onto it. A caller `ref` receives
 * that div, like the legacy trigger forwards its element (consumers measure
 * it — the compat contract types it as the wider legacy `HTMLElement`).
 * `shrink-0`: Chrome under-measures a block wrapper around nested flex content and shrinks it.
 */
function PopoverCompatTrigger({ children, className, ref, ...handlers }: PopoverCompatTriggerProps): React.JSX.Element {
  const internals = React.useContext(PopoverCompatInternalsContext)
  const hover = internals?.hover
  // Setter identity is stable across trigger-element updates, keeping the
  // callback ref stable (no detach/reattach churn when the context value
  // changes on trigger mount).
  const setTriggerElement = internals?.setTriggerElement
  // Only spread when hover-open is on: the Base UI trigger's click/tap-open
  // wiring is untouched either way (hover is additive, like the legacy root).
  const hoverProps = hover?.openOnHover
    ? { openOnHover: true, delay: hover.openDelayMs, closeDelay: hover.closeDelayMs }
    : undefined
  // Adapter between the contract's `Ref<HTMLElement>` and the div's
  // `Ref<HTMLDivElement>` (a RefObject of the wider type is not directly
  // assignable) — same callback-ref shape as the recipe's `PopoverAnchor`.
  // Base UI merges the render element's ref with its own trigger wiring.
  const forwardTriggerRef = React.useCallback(
    (element: HTMLDivElement | null): void => {
      setTriggerElement?.(element)
      if (typeof ref === 'function') {
        ref(element)
      } else if (ref) {
        ref.current = element
      }
    },
    [ref, setTriggerElement],
  )
  return (
    <PopoverRecipeTrigger
      data-slot="popover-compat-trigger"
      nativeButton={false}
      {...hoverProps}
      // oxlint-disable-next-line react/forbid-elements -- the compat trigger IS the raw DOM boundary (no Tamagui Flex here)
      render={<div ref={forwardTriggerRef} className={cn('shrink-0', className)} {...handlers} />}
    >
      {children}
    </PopoverRecipeTrigger>
  )
}

export const PopoverCompat = Object.assign(PopoverCompatRoot, {
  Trigger: PopoverCompatTrigger,
})
