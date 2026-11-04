import { type MouseEvent, type PointerEvent, type RefObject, useEffect, useRef, useState } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { TOOLTIP_COMPAT_POPUP_DATA_SLOT } from '../compile'

/**
 * Touch/tap affordance for TooltipCompat's trigger, adapted from the legacy
 * `ui/src` Tooltip's touch session (INFRA-3506): Base UI's
 * hover is hard-coded `mouseOnly`, so a tap never opens the tooltip on its
 * own.
 *
 * Opens on `click`, gated by the pointer type seen on the preceding
 * pointerdown, rather than on pointerdown itself: the browser already
 * refuses to fire `click` after a touch that turns into a scroll, so this
 * piggybacks on that instead of hand-rolling tap-vs-drag detection. A
 * repeat tap toggles it closed, and tap-away-to-dismiss is added on top
 * (dismissal can't ride pointerleave, which fires as the finger lifts and
 * would immediately close a tooltip that just opened).
 */
export function useTooltipTouchSession({
  isOpen,
  requestOpenChange,
  triggerNodeRef,
}: {
  isOpen: boolean
  requestOpenChange: (nextOpen: boolean) => void
  triggerNodeRef: RefObject<HTMLDivElement | null>
}): {
  handleTriggerPointerDown: (event: PointerEvent<HTMLElement>) => void
  handleTriggerClick: (event: MouseEvent<HTMLElement>) => void
} {
  const [isTouchOpened, setIsTouchOpened] = useState(false)
  const lastPointerTypeRef = useRef('mouse')

  const handleTriggerPointerDown = useEvent((event: PointerEvent<HTMLElement>): void => {
    lastPointerTypeRef.current = event.pointerType
  })

  const handleTriggerClick = useEvent((_event: MouseEvent<HTMLElement>): void => {
    if (lastPointerTypeRef.current === 'mouse') {
      return
    }
    if (isOpen) {
      setIsTouchOpened(false)
      requestOpenChange(false)
      return
    }
    requestOpenChange(true)
    setIsTouchOpened(true)
  })
  // Derived during render (not an effect) so the dismissal listener below never outlives the open.
  if (isTouchOpened && !isOpen) {
    setIsTouchOpened(false)
  }
  useEffect(() => {
    if (!isTouchOpened) {
      return undefined
    }
    const handleDocumentPointerDown = (event: globalThis.PointerEvent): void => {
      const target = event.target
      if (target instanceof Element) {
        if (triggerNodeRef.current?.contains(target) === true) {
          return
        }
        // Don't dismiss for taps inside interactive tooltip content.
        if (target.closest(`[data-slot="${TOOLTIP_COMPAT_POPUP_DATA_SLOT}"]`) !== null) {
          return
        }
      }
      setIsTouchOpened(false)
      requestOpenChange(false)
    }
    // Capture phase, so content that stops propagation can't wedge the tip open.
    document.addEventListener('pointerdown', handleDocumentPointerDown, true)
    return () => document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  }, [isTouchOpened, requestOpenChange, triggerNodeRef])

  return { handleTriggerPointerDown, handleTriggerClick }
}
