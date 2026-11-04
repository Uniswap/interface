/**
 * Web leg of the `LinearGradient` compat — the drop-in twin of
 * the legacy `@tamagui/linear-gradient` component re-exported from the
 * `ui/src` barrel: a stack frame (`overflow: hidden`, `position: relative`,
 * caller props winning over both, exactly like the legacy styled defaults)
 * whose first child is an absolutely-filled element painting
 * `linear-gradient(…)` behind the caller's children.
 *
 * The frame is a ViewCompat — the legacy frame is a YStack, and the parity
 * probe behind view-compat measured a zero base-CSS delta between the plain
 * stacks — so every style pool (media, pseudo, theme, group) rides the
 * already-proven View compilers.
 *
 * The gradient element is measured (ResizeObserver, falling back to a single
 * 1×1 read where ResizeObserver doesn't exist, e.g. jsdom) because the legacy
 * angle math scales the control points by the rendered box — diagonal
 * gradients change angle with aspect ratio. Axis-aligned gradients (every
 * audited call site) are box-independent.
 */
import { forwardRef, type CSSProperties, type JSX, useCallback, useRef, useState } from 'react'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { ViewCompat } from '../view-compat/ViewCompat'
import { linearGradientBackgroundImage } from './compile'
import type { LinearGradientCompatProps } from './props'

const GRADIENT_FILL: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
}

function useMeasuredSize(): { size: { width: number; height: number }; ref: (node: HTMLElement | null) => void } {
  const [size, setSize] = useState({ width: 1, height: 1 })
  const cleanupRef = useRef<(() => void) | undefined>(undefined)
  const ref = useCallback((node: HTMLElement | null) => {
    cleanupRef.current?.()
    cleanupRef.current = undefined
    if (node === null || typeof ResizeObserver === 'undefined') {
      return
    }
    const observer = new ResizeObserver(() => {
      const rect = node.getBoundingClientRect()
      setSize((previous) =>
        previous.width === rect.width && previous.height === rect.height
          ? previous
          : { width: rect.width, height: rect.height },
      )
    })
    observer.observe(node)
    cleanupRef.current = (): void => observer.disconnect()
  }, [])
  return { size, ref }
}

export const LinearGradientCompat = forwardRef<HTMLElement, LinearGradientCompatProps>((props, ref): JSX.Element => {
  const { colors, locations, start, end, children, ...frameProps } = props
  const { size, ref: gradientRef } = useMeasuredSize()
  const backgroundImage = linearGradientBackgroundImage({ colors, locations, start, end, ...size })
  return (
    <ViewCompat overflow="hidden" position="relative" {...frameProps} ref={ref}>
      {/* oxlint-disable-next-line react/forbid-elements -- the compat gradient fill IS the raw DOM boundary (no Tamagui Flex here) */}
      <div ref={gradientRef} style={{ ...GRADIENT_FILL, backgroundImage }} />
      {children}
    </ViewCompat>
  )
})

// The frame delegates to ViewCompat (marked), but the legacy TouchableArea's
// WithInjectedColors reads the marker off THIS element's type — an unmarked
// wrapper would get injected colour guidance over its own styling. Matches what `createCompatComponent` sets on
// factory-built legs (compat/dom.tsx).
LinearGradientCompat.displayName = 'LinearGradientCompat'
markMyceliumPrimitive(LinearGradientCompat)
