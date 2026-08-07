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
import { Popover as PopoverRecipe, PopoverTrigger as PopoverRecipeTrigger } from '../shadcn/popover'
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
 * Mutable registration slot provided by the root, written by the content
 * (there is exactly one content per legacy popover root). Null outside a
 * compat root — the content then has nothing to intercept, matching a
 * standalone render.
 */
export const PopoverCompatDismissInterceptContext =
  React.createContext<React.MutableRefObject<PopoverCompatDismissInterceptors | null> | null>(null)

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
}: PopoverCompatRootProps): React.JSX.Element {
  const dismissInterceptorsRef = React.useRef<PopoverCompatDismissInterceptors | null>(null)
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
  return (
    <PopoverRecipe
      open={open}
      defaultOpen={defaultOpen}
      // Always attached: the interceptors must run for uncontrolled popovers
      // too (details.cancel() stops Base UI's own close there).
      onOpenChange={handleOpenChange}
      modal={false}
    >
      <PopoverCompatDismissInterceptContext.Provider value={dismissInterceptorsRef}>
        <PopoverCompatPositionContext.Provider value={position}>{children}</PopoverCompatPositionContext.Provider>
      </PopoverCompatDismissInterceptContext.Provider>
    </PopoverRecipe>
  )
}

/**
 * Renders a plain `div` wrapper like the Tamagui trigger stack (not a native
 * button) so arbitrary trigger content keeps its own semantics; Base UI wires
 * the open interaction and aria attributes onto it.
 */
function PopoverCompatTrigger({ children, className, ...handlers }: PopoverCompatTriggerProps): React.JSX.Element {
  return (
    <PopoverRecipeTrigger
      data-slot="popover-compat-trigger"
      nativeButton={false}
      // oxlint-disable-next-line react/forbid-elements -- the compat trigger IS the raw DOM boundary (no Tamagui Flex here)
      render={<div className={className} {...handlers} />}
    >
      {children}
    </PopoverRecipeTrigger>
  )
}

export const PopoverCompat = Object.assign(PopoverCompatRoot, {
  Trigger: PopoverCompatTrigger,
})
