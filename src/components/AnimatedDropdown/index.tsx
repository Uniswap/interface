import { animated, useSpring } from 'react-spring'
import useResizeObserver from 'use-resize-observer'

/**
 * @param open conditional to show content or hide
 * @returns Wrapper to smoothly hide and expand content
 */
export default function AnimatedDropdown({ open, children }: React.PropsWithChildren<{ open: boolean }>) {
  const { ref, height } = useResizeObserver()

  const props = useSpring({
    // On initial render, `height` will be undefined as ref has not been set yet.
    // If the dropdown should be open, we fallback to `auto` to avoid flickering.
    // Otherwise, we just animate between actual height (when open) and 0 (when closed).
    height: open ? height ?? 'auto' : 0,
    config: {
      mass: 1.2,
      tension: 300,
      friction: 20,
      clamp: true,
      velocity: 0.01,
    },
  })
  return (
    <animated.div style={{ ...props, overflow: 'hidden', width: '100%', willChange: 'height' }}>
      <div ref={ref}>{children}</div>
    </animated.div>
  )
}
