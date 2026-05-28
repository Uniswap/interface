import { useEffect, useRef } from 'react'
import { Flex } from 'ui/src'
import { AnalyticsDebugEventList } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugEventList'
import { AnalyticsDebugFilterBar } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugFilterBar'
import { AnalyticsDebugHeader } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugHeader'
import { useAnalyticsDebugStore } from 'uniswap/src/features/telemetry/debug/useAnalyticsDebugStore'
import { useFilteredEvents } from 'uniswap/src/features/telemetry/debug/useFilteredEvents'
import { useEvent } from 'utilities/src/react/hooks'

const MIN_WIDTH = 320
const MIN_HEIGHT = 300

export function AnalyticsDebugPanel(): JSX.Element {
  const events = useAnalyticsDebugStore((s) => s.events)
  const filters = useAnalyticsDebugStore((s) => s.filters)
  const knownEventNames = useAnalyticsDebugStore((s) => s.knownEventNames)
  const detailLevel = useAnalyticsDebugStore((s) => s.globalDetailLevel)
  const position = useAnalyticsDebugStore((s) => s.position)
  const size = useAnalyticsDebugStore((s) => s.size)
  const actions = useAnalyticsDebugStore((s) => s.actions)

  const filteredEvents = useFilteredEvents(events, filters)
  const resizeHandleRef = useRef<HTMLDivElement>(null)
  const resizeState = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null)
  const actionsRef = useRef(actions)
  const sizeRef = useRef(size)
  actionsRef.current = actions
  sizeRef.current = size

  const handleMinimize = useEvent(() => {
    actions.setExpanded(false)
  })

  const handleClose = useEvent(() => {
    actions.setEnabled(false)
  })

  // Resize uses setPointerCapture on the handle element so events route directly
  // to it regardless of stopPropagation on the portal container.
  useEffect(() => {
    const el = resizeHandleRef.current
    if (!el) {
      return undefined
    }

    const handlePointerDown = (e: PointerEvent): void => {
      resizeState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: sizeRef.current.width,
        startH: sizeRef.current.height,
      }
      el.setPointerCapture(e.pointerId)
      document.body.style.cursor = 'nwse-resize'
      document.body.style.userSelect = 'none'
    }

    const handlePointerMove = (e: PointerEvent): void => {
      if (!resizeState.current) {
        return
      }
      const dx = e.clientX - resizeState.current.startX
      const dy = e.clientY - resizeState.current.startY
      actionsRef.current.setSize({
        width: Math.max(MIN_WIDTH, resizeState.current.startW + dx),
        height: Math.max(MIN_HEIGHT, resizeState.current.startH + dy),
      })
    }

    const handlePointerUp = (): void => {
      resizeState.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerup', handlePointerUp)

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  return (
    // oxlint-disable-next-line react/forbid-elements: Native DOM element needed for pointer event isolation from modal backdrops
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 2147483647,
        pointerEvents: 'auto',
      }}
    >
      <Flex
        width="100%"
        height="100%"
        backgroundColor="$surface1"
        borderRadius="$rounded8"
        borderWidth={1}
        borderColor="$surface3"
        overflow="hidden"
        $platform-web={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <AnalyticsDebugHeader
          detailLevel={detailLevel}
          eventCount={filteredEvents.length}
          position={position}
          onSetDetailLevel={actions.setDetailLevel}
          onMinimize={handleMinimize}
          onClose={handleClose}
          onClear={actions.clearEvents}
          onPositionChange={actions.setPosition}
        />
        <AnalyticsDebugFilterBar
          filters={filters}
          knownEventNames={knownEventNames}
          onSearchTextChange={actions.setSearchText}
          onToggleEventName={actions.toggleEventNameFilter}
          onAddPropertyFilter={actions.addPropertyFilter}
          onRemovePropertyFilter={actions.removePropertyFilter}
          onClearFilters={actions.clearFilters}
        />
        <AnalyticsDebugEventList events={filteredEvents} detailLevel={detailLevel} />
      </Flex>
      {/* Resize handle - bottom right corner */}
      {/* oxlint-disable-next-line react/forbid-elements: Native DOM element needed for resize pointer capture */}
      <div
        ref={resizeHandleRef}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: 16,
          height: 16,
          cursor: 'nwse-resize',
          background: 'transparent',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          style={{ position: 'absolute', right: 3, bottom: 3, opacity: 0.4 }}
        >
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.5" />
          <line x1="9" y1="5" x2="5" y2="9" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  )
}
