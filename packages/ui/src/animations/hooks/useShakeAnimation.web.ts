import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ViewStyle } from 'react-native'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

export interface ShakeAnimation {
  shakeStyle: ViewStyle
  triggerShakeAnimation: () => void
}

const SHAKE_KEYFRAMES_NAME = 'uniswap-shake-animation'
const SHAKE_DURATION_MS = 300
const SHAKE_KEYFRAMES_CSS = `
    @keyframes ${SHAKE_KEYFRAMES_NAME} {
      0%, 100% { transform: translateX(0); }
      16.67% { transform: translateX(5px); }
      33.33% { transform: translateX(-5px); }
      50% { transform: translateX(5px); }
      66.67% { transform: translateX(-5px); }
      83.33% { transform: translateX(5px); }
    }
  `

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
  useInjectSingleStylesheet({ id: SHAKE_KEYFRAMES_NAME, css: SHAKE_KEYFRAMES_CSS })

  const [isShaking, setIsShaking] = useState(false)
  const isAnimatingRef = useRef(false)

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
