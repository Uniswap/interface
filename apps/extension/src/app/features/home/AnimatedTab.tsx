import { Flex } from '@universe/mycelium'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { type PropsWithChildren, useState } from 'react'

// The legacy 'quicker' preset meant transition: all; keep the transition scoped to the animated properties (color-flash rule).
const TAB_TRANSITION = `opacity ${SPORE_ANIMATION_CURVE_CSS.quicker}, transform ${SPORE_ANIMATION_CURVE_CSS.quicker}`

export function AnimatedTab({
  isActive,
  hideLeft = false,
  hideRight = false,
  children,
}: PropsWithChildren<{ isActive: boolean; hideLeft?: boolean; hideRight?: boolean }>): JSX.Element {
  const hidden = hideLeft || hideRight

  // Inactive tabs are hidden with `display: none`, so anything that measures itself on mount
  // measures 0x0 — and going from hidden to visible fires neither a resize nor a scroll, so a
  // virtualized list never recovers: every row stacks at offset 0 until the first scroll. Mount on
  // first activation instead, then stay mounted so switching back is still instant. Costs nothing
  // up front: every tab whose content is expensive is already passing `skip` while inactive.
  const [hasBeenActive, setHasBeenActive] = useState(isActive)

  if (isActive && !hasBeenActive) {
    setHasBeenActive(true)
  }

  return (
    <Flex
      width="100%"
      mr="-100%"
      display={isActive ? 'flex' : 'none'}
      opacity={hidden ? 0 : 1}
      // if the offset is larger than the horizontal padding of the screen, it
      // will make a horizontal scroll bar appear when using a mouse on macOS
      x={hideLeft ? -10 : hideRight ? 10 : 0}
      pointerEvents={!isActive || hidden ? 'none' : 'auto'}
      style={{ transition: TAB_TRANSITION }}
    >
      {hasBeenActive ? children : null}
    </Flex>
  )
}
