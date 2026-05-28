import { useCallback, useEffect, useRef } from 'react'
import { ElementName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface UseContextMenuTrackingParams {
  isOpen: boolean
  closeMenu: () => void
  elementName?: ElementName
  sectionName?: SectionName
}

/**
 * Hook for tracking context menu open and close events.
 * Tracks opens and closes reactively via isOpen transitions so that ALL close
 * paths (click-outside, sheet dismiss, contentOverride-internal, mouse-leave, etc.)
 * are captured without each path needing to call a tracked handler.
 */
export function useContextMenuTracking({
  isOpen,
  closeMenu,
  elementName,
  sectionName,
}: UseContextMenuTrackingParams): () => void {
  const trace = useTrace()
  const wasOpen = useRef(false)

  useEffect(() => {
    if (isOpen && !wasOpen.current && elementName && sectionName) {
      sendAnalyticsEvent(UniswapEventName.ContextMenuOpened, {
        element: elementName,
        section: sectionName,
        ...trace,
      })
    }

    if (!isOpen && wasOpen.current && elementName && sectionName) {
      sendAnalyticsEvent(UniswapEventName.ContextMenuClosed, {
        element: elementName,
        section: sectionName,
        ...trace,
      })
    }

    wasOpen.current = isOpen
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [isOpen, elementName, sectionName])

  const trackedCloseMenu = useCallback(() => {
    closeMenu()
  }, [closeMenu])

  return trackedCloseMenu
}
