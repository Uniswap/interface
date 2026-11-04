import { Flex } from '@universe/mycelium'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { Activity, type PropsWithChildren, useState } from 'react'

// The legacy 'quicker' preset meant transition: all; keep the transition scoped to the animated properties (color-flash rule).
const TAB_TRANSITION = `opacity ${SPORE_ANIMATION_CURVE_CSS.quicker}, transform ${SPORE_ANIMATION_CURVE_CSS.quicker}`

export function AnimatedTab({
  isActive,
  hideLeft = false,
  hideRight = false,
  children,
}: PropsWithChildren<{ isActive: boolean; hideLeft?: boolean; hideRight?: boolean }>): JSX.Element {
  const hidden = hideLeft || hideRight

  // Mount on first activation; an idle tab never renders. Every tab whose content is expensive
  // already passes `skip` while inactive.
  const [hasBeenActive, setHasBeenActive] = useState(isActive)

  if (isActive && !hasBeenActive) {
    setHasBeenActive(true)
  }

  // Inactive tabs stay mounted (instant switch-back) as a hidden Activity, so no effect runs while hidden:
  // a virtualized list measuring itself at 0x0 under display:none cascades into React's nested-update limit.
  return (
    <Activity mode={isActive ? 'visible' : 'hidden'}>
      <Flex
        width="100%"
        mr="-100%"
        opacity={hidden ? 0 : 1}
        // if the offset is larger than the horizontal padding of the screen, it
        // will make a horizontal scroll bar appear when using a mouse on macOS
        x={hideLeft ? -10 : hideRight ? 10 : 0}
        pointerEvents={!isActive || hidden ? 'none' : 'auto'}
        style={{ transition: TAB_TRANSITION }}
      >
        {hasBeenActive ? children : null}
      </Flex>
    </Activity>
  )
}
