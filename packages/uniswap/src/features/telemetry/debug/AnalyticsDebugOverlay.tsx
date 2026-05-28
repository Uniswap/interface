import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnalyticsDebugBadge } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugBadge'
import { AnalyticsDebugPanel } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugPanel'
import { useAnalyticsDebugStore } from 'uniswap/src/features/telemetry/debug/useAnalyticsDebugStore'
import { useEvent } from 'utilities/src/react/hooks'

function AnalyticsDebugOverlayContent(): JSX.Element | null {
  const expanded = useAnalyticsDebugStore((s) => s.expanded)
  const newEventCount = useAnalyticsDebugStore((s) => s.newEventCount)
  const position = useAnalyticsDebugStore((s) => s.position)
  const actions = useAnalyticsDebugStore((s) => s.actions)

  const handleExpand = useEvent(() => {
    actions.toggleExpanded()
  })

  if (expanded) {
    return <AnalyticsDebugPanel />
  }

  return (
    <AnalyticsDebugBadge
      newEventCount={newEventCount}
      position={position}
      onExpand={handleExpand}
      onPositionChange={actions.setPosition}
    />
  )
}

/**
 * Stops native events from reaching document-level "outside click" listeners
 * that modals use. Applied at bubble phase on the portal container so child
 * event handling completes normally before the event reaches this point.
 */
function addEventIsolation(container: HTMLDivElement): () => void {
  const stop = (e: Event): void => {
    e.stopPropagation()
  }

  container.addEventListener('mousedown', stop)
  container.addEventListener('mouseup', stop)
  container.addEventListener('click', stop)
  container.addEventListener('pointerdown', stop)
  container.addEventListener('pointerup', stop)

  return () => {
    container.removeEventListener('mousedown', stop)
    container.removeEventListener('mouseup', stop)
    container.removeEventListener('click', stop)
    container.removeEventListener('pointerdown', stop)
    container.removeEventListener('pointerup', stop)
  }
}

/**
 * Stops React synthetic events from bubbling up through the React component tree.
 * createPortal preserves React tree bubbling, so without this, clicks inside the
 * portal would propagate through AnalyticsDebugOverlay → TopLevelModals → app,
 * triggering modal close handlers.
 *
 * Uses nativeEvent.stopImmediatePropagation() which prevents other native listeners
 * on the same DOM node from firing — since React 18 delegates all events to the
 * React root container, this prevents React from even seeing these events, which
 * means no synthetic event bubbling through the React tree occurs.
 *
 * This is safe because child element interactions within the overlay use native DOM
 * events directly (native <input>, native pointer events for drag), and Tamagui's
 * TouchableArea uses onPress which is based on pointer events that complete before
 * reaching this handler.
 */
function stopNativeForReact(e: React.MouseEvent | React.PointerEvent): void {
  e.nativeEvent.stopImmediatePropagation()
}

export function AnalyticsDebugOverlay(): JSX.Element | null {
  const enabled = useAnalyticsDebugStore((s) => s.enabled)
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const container = document.createElement('div')
    container.id = 'analytics-debug-portal'
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.left = '0'
    container.style.width = '0'
    container.style.height = '0'
    container.style.zIndex = '2147483647'
    container.style.pointerEvents = 'none'
    document.body.appendChild(container)

    const removeIsolation = addEventIsolation(container)
    setPortalContainer(container)

    return () => {
      removeIsolation()
      document.body.removeChild(container)
      setPortalContainer(null)
    }
  }, [enabled])

  if (!enabled || !portalContainer) {
    return null
  }

  return createPortal(
    // oxlint-disable-next-line react/forbid-elements: Event isolation boundary for portal — prevents React synthetic events from reaching modal backdrops
    <div
      onMouseDown={stopNativeForReact}
      onMouseUp={stopNativeForReact}
      onClick={stopNativeForReact}
      onPointerDown={stopNativeForReact}
      onPointerUp={stopNativeForReact}
    >
      <AnalyticsDebugOverlayContent />
    </div>,
    portalContainer,
  )
}
