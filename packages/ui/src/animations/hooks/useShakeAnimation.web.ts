import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'

export interface ShakeAnimation {
  shakeStyle: ViewStyle
  triggerShakeAnimation: () => void
}

// CSS keyframes for shake animation - injected once into the document
const SHAKE_KEYFRAMES_NAME = 'uniswap-shake-animation'
const SHAKE_DURATION_MS = 300

function injectShakeKeyframes(): void {
  if (typeof document === 'undefined') {
    return
  }
  if (document.getElementById(SHAKE_KEYFRAMES_NAME)) {
    return
  }
  const style = document.createElement('style')
  style.id = SHAKE_KEYFRAMES_NAME
  style.textContent = `
    @keyframes ${SHAKE_KEYFRAMES_NAME} {
      0%, 100% { transform: translateX(0); }
      16.67% { transform: translateX(5px); }
      33.33% { transform: translateX(-5px); }
      50% { transform: translateX(5px); }
      66.67% { transform: translateX(-5px); }
      83.33% { transform: translateX(5px); }
    }
  `
  document.head.appendChild(style)
}

/**
 * Web-specific shake animation hook using CSS animations.
 *
 * Returns a style object and a trigger function. When triggered, the element
 * will shake horizontally 3 times using CSS keyframe animations.
 *
 * The animation state is tracked via React state to trigger re-renders with
 * the appropriate CSS animation property.
 */
export const useShakeAnimation = (): ShakeAnimation => {
  const [isShaking, setIsShaking] = useState(false)
  const isAnimatingRef = useRef(false)

  // Inject keyframes on first use
  useMemo(() => {
    injectShakeKeyframes()
  }, [])

  const triggerShakeAnimation = useCallback(() => {
    if (isAnimatingRef.current) {
      return
    }

    isAnimatingRef.current = true
    setIsShaking(true)
  }, [])

  // Clean up animation after duration - handles unmount cleanup properly
  useEffect(() => {
    if (!isShaking) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setIsShaking(false)
      isAnimatingRef.current = false
    }, SHAKE_DURATION_MS)

    return () => clearTimeout(timeoutId)
  }, [isShaking])

  // Return a style object with CSS animation when shaking
  const shakeStyle = useMemo((): ViewStyle => {
    if (!isShaking) {
      return {}
    }
    // `animation` is a valid CSS property on web but not in ViewStyle type
    return {
      animation: `${SHAKE_KEYFRAMES_NAME} ${SHAKE_DURATION_MS}ms ease-in-out`,
    } as unknown as ViewStyle
  }, [isShaking])

  return useMemo(
    () => ({
      shakeStyle,
      triggerShakeAnimation,
    }),
    [shakeStyle, triggerShakeAnimation],
  )
}
