import { useEffect, useRef } from 'react'
import { Flex, Text } from 'ui/src'

interface AnalyticsDebugBadgeProps {
  newEventCount: number
  onExpand: () => void
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}

export function AnalyticsDebugBadge({
  newEventCount,
  onExpand,
  position,
  onPositionChange,
}: AnalyticsDebugBadgeProps): JSX.Element {
  const badgeRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const hasDragged = useRef(false)
  const positionRef = useRef(position)
  const onPositionChangeRef = useRef(onPositionChange)
  const onExpandRef = useRef(onExpand)

  positionRef.current = position
  onPositionChangeRef.current = onPositionChange
  onExpandRef.current = onExpand

  useEffect(() => {
    const el = badgeRef.current
    if (!el) {
      return undefined
    }

    const handlePointerDown = (e: PointerEvent): void => {
      hasDragged.current = false
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: positionRef.current.x,
        startPosY: positionRef.current.y,
      }
      el.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: PointerEvent): void => {
      if (!dragState.current) {
        return
      }
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDragged.current = true
      }
      onPositionChangeRef.current({
        x: dragState.current.startPosX + dx,
        y: dragState.current.startPosY + dy,
      })
    }

    const handlePointerUp = (): void => {
      dragState.current = null
      if (!hasDragged.current) {
        onExpandRef.current()
      }
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
    // oxlint-disable-next-line react/forbid-elements: Native DOM element needed for pointer capture drag + event isolation
    <div
      ref={badgeRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 2147483647,
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      <Flex
        centered
        width={44}
        height={44}
        borderRadius="$roundedFull"
        backgroundColor="$accent1"
        hoverStyle={{ opacity: 0.9 }}
      >
        <Text variant="body3" color="$white" fontWeight="700" fontSize={11}>
          {newEventCount > 99 ? '99+' : newEventCount > 0 ? String(newEventCount) : 'A'}
        </Text>
      </Flex>
    </div>
  )
}
