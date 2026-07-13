import { MutableRefObject, useEffect, useRef, useState } from 'react'
import { useBalanceChangeIndication } from 'uniswap/src/components/AnimatedNumber/hooks/useBalanceChangeIndication'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'

interface UseAnimatedNumberAnimationParams {
  value: string | undefined
  numericValue: number | undefined
  disableAnimations: boolean
  colorIndicationDuration: number
  statusSuccessColor: string
  neutral2Color: string
  forceDirection?: AnimatedNumberDirection
}

export function useAnimatedNumberAnimation({
  value,
  numericValue,
  disableAnimations,
  colorIndicationDuration,
  statusSuccessColor,
  neutral2Color,
  forceDirection,
}: UseAnimatedNumberAnimationParams): {
  animateGen: number
  dirRef: MutableRefObject<AnimatedNumberDirection>
  isHoverRelease: boolean
  nextColor: string | undefined
  commonPrefixLength: number
} {
  // Freeze prev refs while disabled so hover scrubbing doesn't shift the animation reference point
  const prevValueRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (!disableAnimations) {
      prevValueRef.current = value
    }
  })
  const prevValue = prevValueRef.current

  const prevNumericValueRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!disableAnimations && numericValue != null) {
      prevNumericValueRef.current = numericValue
    }
  })
  const prevBalance = prevNumericValueRef.current

  // Pass frozen values while hovering so useBalanceChangeIndication sees value === prevValue and skips
  const effectiveValue = disableAnimations ? prevValue : value
  const effectiveBalance = disableAnimations ? prevBalance : numericValue

  // One-render-late tracking to detect hover-release without an extra state variable
  const prevDisabledRef = useRef(disableAnimations)
  const isHoverRelease = prevDisabledRef.current && !disableAnimations
  useEffect(() => {
    prevDisabledRef.current = disableAnimations
  })

  const [animateGen, setAnimateGen] = useState(0)
  const dirRef = useRef<AnimatedNumberDirection>(AnimatedNumberDirection.NONE)

  const { nextColor, commonPrefixLength } = useBalanceChangeIndication({
    balance: effectiveBalance,
    value: effectiveValue,
    prevValue,
    prevBalance,
    colorIndicationDuration,
    statusSuccessColor,
    neutral2Color,
    forceDirection,
    onDirectionChange: (direction) => {
      dirRef.current = direction
    },
    onAnimate: () => {
      setAnimateGen((g) => g + 1)
    },
  })

  return { animateGen, dirRef, isHoverRelease, nextColor, commonPrefixLength }
}
