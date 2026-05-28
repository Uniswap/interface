import { useEffect, useRef } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Minus, Trash, X } from 'ui/src/components/icons'
import { useEvent } from 'utilities/src/react/hooks'

interface AnalyticsDebugHeaderProps {
  detailLevel: 1 | 2 | 3
  eventCount: number
  onSetDetailLevel: (level: 1 | 2 | 3) => void
  onMinimize: () => void
  onClose: () => void
  onClear: () => void
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}

const selectStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: 'none',
  borderRadius: 4,
  color: 'inherit',
  fontSize: 11,
  height: 22,
  cursor: 'pointer',
  outline: 'none',
}

export function AnalyticsDebugHeader({
  detailLevel,
  eventCount,
  onSetDetailLevel,
  onMinimize,
  onClose,
  onClear,
  position,
  onPositionChange,
}: AnalyticsDebugHeaderProps): JSX.Element {
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)
  const positionRef = useRef(position)
  const onPositionChangeRef = useRef(onPositionChange)

  positionRef.current = position
  onPositionChangeRef.current = onPositionChange

  // Drag is only on the drag handle area (left side with title), not the controls
  useEffect(() => {
    const el = dragHandleRef.current
    if (!el) {
      return undefined
    }

    const handlePointerDown = (e: PointerEvent): void => {
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
      onPositionChangeRef.current({
        x: dragState.current.startPosX + dx,
        y: dragState.current.startPosY + dy,
      })
    }

    const handlePointerUp = (): void => {
      dragState.current = null
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

  const handleDetailChange = useEvent((e: React.ChangeEvent<HTMLSelectElement>) => {
    onSetDetailLevel(Number(e.target.value) as 1 | 2 | 3)
  })

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="$surface2"
      px="$spacing8"
      py="$spacing4"
      borderTopLeftRadius="$rounded8"
      borderTopRightRadius="$rounded8"
    >
      {/* Drag handle area — only this part is draggable */}
      {/* oxlint-disable-next-line react/forbid-elements: Native DOM element needed for setPointerCapture drag */}
      <div
        ref={dragHandleRef}
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'grab', flexShrink: 1, userSelect: 'none' }}
      >
        {/* 6-dot grip icon — signals "draggable" */}
        <svg width="8" height="14" viewBox="0 0 8 14" style={{ opacity: 0.4, flexShrink: 0 }}>
          <circle cx="2" cy="2" r="1.2" fill="currentColor" />
          <circle cx="6" cy="2" r="1.2" fill="currentColor" />
          <circle cx="2" cy="7" r="1.2" fill="currentColor" />
          <circle cx="6" cy="7" r="1.2" fill="currentColor" />
          <circle cx="2" cy="12" r="1.2" fill="currentColor" />
          <circle cx="6" cy="12" r="1.2" fill="currentColor" />
        </svg>
        <Text variant="body3" color="$neutral1" fontWeight="600">
          Analytics
        </Text>
        <Flex backgroundColor="$surface3" borderRadius="$roundedFull" px="$spacing4" py={1}>
          <Text variant="body4" color="$neutral2" fontSize={10}>
            {eventCount}
          </Text>
        </Flex>
      </div>

      {/* Controls — NOT draggable */}
      <Flex row alignItems="center" gap="$spacing4" flexShrink={0}>
        {/* Detail level dropdown */}
        <select value={detailLevel} style={selectStyle} onChange={handleDetailChange}>
          <option value={1}>Props Only</option>
          <option value={2}>Props + Trace</option>
          <option value={3}>Props + Trace + Meta</option>
        </select>

        {/* Clear button */}
        <TouchableArea onPress={onClear}>
          <Flex centered width={20} height={20} hoverStyle={{ opacity: 0.7 }}>
            <Trash size={12} color="$neutral2" />
          </Flex>
        </TouchableArea>

        {/* Minimize button */}
        <TouchableArea onPress={onMinimize}>
          <Flex centered width={20} height={20} hoverStyle={{ opacity: 0.7 }}>
            <Minus size={12} color="$neutral2" />
          </Flex>
        </TouchableArea>

        {/* Close button */}
        <TouchableArea onPress={onClose}>
          <Flex centered width={20} height={20} hoverStyle={{ opacity: 0.7 }}>
            <X size={12} color="$neutral2" />
          </Flex>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}
