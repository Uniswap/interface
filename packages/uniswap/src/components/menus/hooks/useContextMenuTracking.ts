import { useCallback, useEffect } from 'react'
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
 * Returns a tracked close handler that wraps the original closeMenu function.
 */
export function useContextMenuTracking({
  isOpen,
  closeMenu,
  elementName,
  sectionName,
}: UseContextMenuTrackingParams): () => void {
  const trace = useTrace()

  // Track menu open
  // biome-ignore lint/correctness/useExhaustiveDependencies: trace is static context, shouldn't trigger re-fire
  useEffect(() => {
    if (isOpen && elementName && sectionName) {
      sendAnalyticsEvent(UniswapEventName.ContextMenuOpened, {
        element: elementName,
        section: sectionName,
        ...trace,
      })
    }
  }, [isOpen, elementName, sectionName])

  // Track menu close and return wrapped close handler
  // biome-ignore lint/correctness/useExhaustiveDependencies: trace is static context, shouldn't trigger re-fire
  const trackedCloseMenu = useCallback(() => {
    if (isOpen && elementName && sectionName) {
      sendAnalyticsEvent(UniswapEventName.ContextMenuClosed, {
        element: elementName,
        section: sectionName,
        ...trace,
      })
    }
    closeMenu()
  }, [isOpen, closeMenu, elementName, sectionName])

  return trackedCloseMenu
}
