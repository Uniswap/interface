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
import type { BaseUIEvent } from '@base-ui/react/types'
import * as React from 'react'
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
 * Makes its single child element the trigger: Base UI wires the open interaction and aria attributes onto it, so
 * a button child is the trigger itself rather than a button nested in a wrapper. The child must forward its ref
 * and props to its root element (mycelium's Flex, TouchableArea and buttons do). A caller `ref` receives that
 * element, like the legacy trigger forwards its own (consumers measure it — the compat contract types it as the
 * wider legacy `HTMLElement`).
 */
function PopoverCompatTrigger({
  children,
  nativeButton = true,
  openOnClick = true,
  ref,
}: PopoverCompatTriggerProps): React.JSX.Element {
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
  // Base UI merges this callback ref with its own trigger wiring onto the child.
  const forwardTriggerRef = React.useCallback(
    (element: HTMLElement | null): void => {
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
      ref={forwardTriggerRef}
      data-slot="popover-compat-trigger"
      nativeButton={openOnClick ? nativeButton : false}
      {...hoverProps}
      {...(openOnClick ? undefined : HOVER_REGION_PROPS)}
      // Handlers passed here run before Base UI's own, so this skips its click toggle and leaves hover alone.
      onClick={openOnClick ? undefined : preventBaseUIClick}
      render={children}
    />
  )
}

export const PopoverCompat = Object.assign(PopoverCompatRoot, {
  Trigger: PopoverCompatTrigger,
})

// A trigger nothing can activate isn't a button: no role, no tab stop, no expanded state. Base UI's own
// trigger attributes yield to these.
const HOVER_REGION_PROPS = {
  role: undefined,
  tabIndex: undefined,
  'aria-expanded': undefined,
  'aria-haspopup': undefined,
} as const

function preventBaseUIClick(event: BaseUIEvent<React.MouseEvent>): void {
  event.preventBaseUIHandler()
}
