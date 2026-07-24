import { useEffect, useRef, useState } from 'react'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { longestCommonPrefix } from 'uniswap/src/components/AnimatedNumber/utils/longestCommonPrefix'

function getBalanceChangeDirection(balance: number, prevBalance: number | undefined): AnimatedNumberDirection {
  if (prevBalance == null) {
    return AnimatedNumberDirection.NONE
  }
  if (balance > prevBalance) {
    return AnimatedNumberDirection.UP
  }
  if (balance < prevBalance) {
    return AnimatedNumberDirection.DOWN
  }
  return AnimatedNumberDirection.NONE
}

function getBalanceChangeColor({
  direction,
  statusSuccessColor,
  neutral2Color,
}: {
  direction: AnimatedNumberDirection
  statusSuccessColor: string
  neutral2Color: string
}): string | undefined {
  if (direction === AnimatedNumberDirection.UP) {
    return statusSuccessColor
  }
  if (direction === AnimatedNumberDirection.DOWN) {
    return neutral2Color
  }
  return undefined
}

type UseBalanceChangeIndicationParams = {
  balance?: number
  value?: string
  prevValue: string | undefined
  prevBalance: number | undefined
  colorIndicationDuration: number
  statusSuccessColor: string
  neutral2Color: string
  /** Native: skip unless balance and value are truthy. Web: skip on null/undefined balance or value. */
  requireTruthyBalanceAndValue?: boolean
  /** Overrides the computed up/down direction (and its color) — e.g. for values like elapsed time that should always read as increasing. */
  forceDirection?: AnimatedNumberDirection
  onDirectionChange?: (direction: AnimatedNumberDirection) => void
  onAnimate?: () => void
}

export function useBalanceChangeIndication({
  balance,
  value,
  prevValue,
  prevBalance,
  colorIndicationDuration,
  statusSuccessColor,
  neutral2Color,
  requireTruthyBalanceAndValue = false,
  forceDirection,
  onDirectionChange,
  onAnimate,
}: UseBalanceChangeIndicationParams): {
  nextColor: string | undefined
  commonPrefixLength: number
} {
  const [nextColor, setNextColor] = useState<string | undefined>()
  const [commonPrefixLength, setCommonPrefixLength] = useState(0)
  const colorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onDirectionChangeRef = useRef(onDirectionChange)
  const onAnimateRef = useRef(onAnimate)
  onDirectionChangeRef.current = onDirectionChange
  onAnimateRef.current = onAnimate

  useEffect(() => {
    const shouldSkip = requireTruthyBalanceAndValue
      ? !(balance && value && value !== prevValue)
      : balance == null || value == null || value === prevValue

    if (shouldSkip || balance == null || value == null) {
      return
    }

    if (colorTimeoutRef.current != null) {
      clearTimeout(colorTimeoutRef.current)
      colorTimeoutRef.current = null
    }

    const direction = forceDirection ?? getBalanceChangeDirection(balance, prevBalance)
    setNextColor(getBalanceChangeColor({ direction, statusSuccessColor, neutral2Color }))
    onDirectionChangeRef.current?.(direction)
    setCommonPrefixLength(longestCommonPrefix(String(value), String(prevValue ?? '')).length)
    onAnimateRef.current?.()
    colorTimeoutRef.current = setTimeout(() => {
      setNextColor(undefined)
    }, colorIndicationDuration)
  }, [
    balance,
    colorIndicationDuration,
    forceDirection,
    neutral2Color,
    prevBalance,
    prevValue,
    requireTruthyBalanceAndValue,
    statusSuccessColor,
    value,
  ])

  useEffect(() => {
    return () => {
      if (colorTimeoutRef.current != null) {
        clearTimeout(colorTimeoutRef.current)
      }
    }
  }, [])

  return { nextColor, commonPrefixLength }
}
