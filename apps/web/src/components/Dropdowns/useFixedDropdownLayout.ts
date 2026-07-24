import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { EffectiveModalOrSheetZIndexContext, stackingLayerAbove } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { getDropdownAvailableSpace, getDropdownVerticalLayout } from '~/components/Dropdowns/dropdownLayoutUtils'

interface UseFixedDropdownLayoutParams {
  alignRight?: boolean
  allowFlip?: boolean
  dropdownOffset: number
  enabled: boolean
  forceFlipUp?: boolean
  isOpen: boolean
  isSheet: boolean
  matchTriggerWidth?: boolean
  measuringDropdownRef: RefObject<HTMLDivElement | null>
  triggerRef: RefObject<HTMLDivElement | null>
  // Height of chrome (e.g. the sticky app header) that overlaps the top of the viewport once scrolled
  topInset?: number
}

interface FixedDropdownLayout {
  dropdownMaxHeight?: number
  dropdownRef: RefObject<HTMLDivElement | null>
  fixedStyle?: CSSProperties
  flipVertical: boolean
  onExitComplete: () => void
  shouldRenderPortal: boolean
  zIndex: number
}

function areFixedStylesEqual(prev: CSSProperties | undefined, next: CSSProperties): boolean {
  if (!prev) {
    return false
  }

  return (
    prev.bottom === next.bottom &&
    prev.left === next.left &&
    prev.maxWidth === next.maxWidth &&
    prev.pointerEvents === next.pointerEvents &&
    prev.position === next.position &&
    prev.top === next.top &&
    prev.width === next.width
  )
}

// Fixed dropdowns render in a body portal so menus can escape clipped modal parents.
export function useFixedDropdownLayout({
  alignRight,
  allowFlip,
  dropdownOffset,
  enabled,
  forceFlipUp,
  isOpen,
  isSheet,
  matchTriggerWidth,
  measuringDropdownRef,
  triggerRef,
  topInset = 0,
}: UseFixedDropdownLayoutParams): FixedDropdownLayout {
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const parentZIndex = useContext(EffectiveModalOrSheetZIndexContext)
  const [flipVertical, setFlipVertical] = useState(false)
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | undefined>(undefined)
  const [fixedStyle, setFixedStyle] = useState<CSSProperties | undefined>(undefined)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const updateLayout = useCallback(() => {
    if (!enabled || !isOpen || isSheet || !triggerRef.current) {
      return
    }

    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const { spaceAbove, spaceBelow } = getDropdownAvailableSpace({
      dropdownOffset,
      triggerRect: rect,
      viewportHeight,
      topInset,
    })
    const dropdownHeight = measuringDropdownRef.current?.offsetHeight ?? 0
    const { dropdownMaxHeight: nextDropdownMaxHeight, flipVertical: shouldFlip } = getDropdownVerticalLayout({
      allowFlip,
      dropdownHeight,
      forceFlipUp,
      spaceAbove,
      spaceBelow,
    })

    setFlipVertical((prev) => (prev === shouldFlip ? prev : shouldFlip))
    setDropdownMaxHeight((prev) => (prev === nextDropdownMaxHeight ? prev : nextDropdownMaxHeight))

    const dropdownWidth = matchTriggerWidth ? rect.width : (measuringDropdownRef.current?.offsetWidth ?? rect.width)
    const minLeft = dropdownOffset
    const maxLeft = Math.max(minLeft, viewportWidth - dropdownWidth - dropdownOffset)
    const alignedLeft = alignRight ? rect.right - dropdownWidth : rect.left
    const left = Math.min(Math.max(alignedLeft, minLeft), maxLeft)

    const nextFixedStyle = {
      bottom: shouldFlip ? viewportHeight - rect.top + dropdownOffset : 'unset',
      left,
      maxWidth: viewportWidth - dropdownOffset * 2,
      pointerEvents: 'auto',
      position: 'fixed',
      top: shouldFlip ? 'unset' : rect.bottom + dropdownOffset,
      width: matchTriggerWidth ? rect.width : undefined,
    } satisfies CSSProperties

    setFixedStyle((prev) => (areFixedStylesEqual(prev, nextFixedStyle) ? prev : nextFixedStyle))
  }, [
    alignRight,
    allowFlip,
    dropdownOffset,
    enabled,
    forceFlipUp,
    isOpen,
    isSheet,
    matchTriggerWidth,
    measuringDropdownRef,
    triggerRef,
    topInset,
  ])

  const cancelScheduledLayoutUpdate = useCallback(() => {
    if (animationFrameRef.current === undefined) {
      return
    }

    window.cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = undefined
  }, [])

  const scheduleLayoutUpdate = useCallback(() => {
    if (animationFrameRef.current !== undefined) {
      return
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = undefined
      updateLayout()
    })
  }, [updateLayout])

  useLayoutEffect(() => {
    updateLayout()
  }, [updateLayout])

  useEffect(() => cancelScheduledLayoutUpdate, [cancelScheduledLayoutUpdate])

  useEffect(() => {
    if (!enabled || isSheet) {
      cancelScheduledLayoutUpdate()
      setFixedStyle(undefined)
    }
  }, [cancelScheduledLayoutUpdate, enabled, isSheet])

  useEffect(() => {
    if (!enabled || !isOpen || isSheet) {
      return undefined
    }

    window.addEventListener('resize', scheduleLayoutUpdate)
    window.addEventListener('scroll', scheduleLayoutUpdate, true)

    return () => {
      window.removeEventListener('resize', scheduleLayoutUpdate)
      window.removeEventListener('scroll', scheduleLayoutUpdate, true)
      cancelScheduledLayoutUpdate()
    }
  }, [cancelScheduledLayoutUpdate, enabled, isOpen, isSheet, scheduleLayoutUpdate])

  useEffect(() => {
    if (!enabled || !isOpen || isSheet || !measuringDropdownRef.current || typeof ResizeObserver === 'undefined') {
      return undefined
    }

    const observer = new ResizeObserver(scheduleLayoutUpdate)
    observer.observe(measuringDropdownRef.current)

    return () => observer.disconnect()
  }, [enabled, isOpen, isSheet, measuringDropdownRef, scheduleLayoutUpdate])

  // Keep the last fixed position until exit completes so portaled dropdowns can animate closed.
  const onExitComplete = useCallback(() => {
    setFixedStyle(undefined)
  }, [])

  return {
    dropdownMaxHeight,
    dropdownRef,
    fixedStyle,
    flipVertical,
    onExitComplete,
    shouldRenderPortal: enabled && !isSheet && (isOpen || fixedStyle !== undefined),
    zIndex: stackingLayerAbove(parentZIndex, zIndexes.popover),
  }
}
