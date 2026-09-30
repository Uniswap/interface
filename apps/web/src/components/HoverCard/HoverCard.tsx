import { TouchableArea, useIsTouchDevice } from '@universe/mycelium'
import type { ComponentProps, ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import { AdaptiveWebPopoverContent, Popover } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { useCloseOnOutsideScroll } from '~/hooks/useCloseOnOutsideScroll'

const POPOVER_HORIZONTAL_PADDING = 16

// Module-level constant — Popover memoizes its floating context on the `hoverable` reference
const HOVERABLE_PROPS = { delay: { open: 300 } }

export type HoverCardPlacement = ComponentProps<typeof Popover>['placement']

/** Keeps presses inside the card (and on its trigger) from reaching the row/cell that hosts it. */
export const stopPressEventPropagation = {
  onPressIn: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPressOut: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPress: (e: { stopPropagation: () => void }) => e.stopPropagation(),
}

export interface HoverCardState {
  isOpen: boolean
  /** Latched on first open so consumers can defer their fetches until the card is actually used. */
  hasOpenIntent: boolean
  close: () => void
  onOpenChange: (open: boolean) => void
}

/** Hover-open state (the Popover applies the open delay). */
export function useHoverCardState(): HoverCardState {
  // `HoverCard` never renders the popover on touch, so gate here too or consumers fetch for a card that can't show.
  const isTouchDevice = useIsTouchDevice()
  const [isOpen, setIsOpen] = useState(false)
  const [hasOpenIntent, setHasOpenIntent] = useState(false)

  const close = useCallback((): void => setIsOpen(false), [])

  const onOpenChange = useCallback((open: boolean): void => {
    setIsOpen(open)
    if (open) {
      setHasOpenIntent(true)
    }
  }, [])

  return {
    isOpen: !isTouchDevice && isOpen,
    hasOpenIntent: !isTouchDevice && hasOpenIntent,
    close,
    onOpenChange,
  }
}

/**
 * Body width that keeps the popover a `widthOffset` gap from the viewport edge when it floats beside a
 * centered container (e.g. the search modal).
 */
export function useHoverCardMaxContentWidth({
  containerWidth,
  widthOffset,
}: {
  containerWidth?: number
  widthOffset?: number
}): number | undefined {
  const { fullWidth: windowWidth } = useDeviceDimensions()
  return containerWidth !== undefined
    ? (windowWidth - containerWidth) / 2 - (widthOffset ?? 0) * 2 - POPOVER_HORIZONTAL_PADDING * 2
    : undefined
}

interface HoverCardProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  placement?: HoverCardPlacement
  offset?: number
  /** The child already shrinks on press; opts the trigger's own shrink out so the two don't compound. */
  childOwnsPressFeedback?: boolean
  children: ReactNode
  content: ReactNode
}

/**
 * Popover shell shared by the hover cards. Consumers own the open state via `useHoverCardState` to gate fetches on it.
 * The wrapped child is the interactive element, so neither trigger wrapper is a button or a tab stop of its own.
 */
export function HoverCard({
  isOpen,
  onOpenChange,
  placement = 'bottom-start',
  offset,
  childOwnsPressFeedback = false,
  children,
  content,
}: HoverCardProps): JSX.Element {
  const popoverContentRef = useRef<HTMLDivElement>(null)
  const shadowProps = useShadowPropsMedium()
  const isTouchDevice = useIsTouchDevice()

  const close = useCallback((): void => onOpenChange(false), [onOpenChange])
  useCloseOnOutsideScroll({ contentRef: popoverContentRef, isOpen, onClose: close })

  if (isTouchDevice) {
    return <>{children}</>
  }

  // The trigger is a Popover anchor with no onPress of its own. Where the child row already shrinks on press,
  // the frame's default compounds with it (`:active` applies to ancestors too, so both fire at once) — 0.98 * 0.98
  // on a 600px row is ~12px a side. Those callers opt out on both pools, the way `activeOpacity={1}` below already
  // opts out of the press dim. Callers whose child has no shrink of its own (a plain link cell) keep the default,
  // which is their only press feedback.
  const inertTriggerProps = childOwnsPressFeedback
    ? ({ pressStyle: { scale: 1 }, focusVisibleStyle: { scaleX: 1, scaleY: 1 } } as const)
    : undefined

  return (
    <Popover
      hoverable={HOVERABLE_PROPS}
      open={isOpen}
      placement={placement}
      offset={offset}
      stayInFrame
      allowFlip
      onOpenChange={onOpenChange}
    >
      <Popover.Trigger role="none" tabIndex={-1}>
        <TouchableArea
          role="none"
          variant="unstyled"
          activeOpacity={1}
          {...inertTriggerProps}
          {...stopPressEventPropagation}
        >
          {children}
        </TouchableArea>
      </Popover.Trigger>
      <AdaptiveWebPopoverContent
        ref={popoverContentRef}
        // The Popover traps focus by default, which would pull DOM focus out of whatever the user is typing in
        // (e.g. the search input) as soon as a row's card opens.
        disableFocusScope
        isOpen={isOpen}
        placement={placement}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        p="$spacing16"
        overflow="hidden"
        {...shadowProps}
        {...stopPressEventPropagation}
      >
        {content}
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
