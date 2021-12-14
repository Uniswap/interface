import { animated, useSpring } from 'react-spring'
import useResizeObserver from 'use-resize-observer'

/**
 * @param open conditional to show content or hide
 * @returns Wrapper to smoothly hide and expand content
 */
export default function AnimatedDropdown({ open, children }: { open: boolean; children: JSX.Element }) {
  const { ref, height } = useResizeObserver()

  const props = useSpring({
    maxHeight: open ? height ?? 0 : 0,
    config: {
      mass: 1.2,
      tension: 300,
      friction: 20,
      clamp: true,
      velocity: 0.01,
    },
  })

  return (
    <animated.div
      style={{
        ...props,
        overflow: 'hidden',
        width: '100%',
        willChange: 'height',
      }}
    >
      <div ref={ref}>{children}</div>
    </animated.div>
  )
}
