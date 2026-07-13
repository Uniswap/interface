import { useMemo } from 'react'
import { STAGGER_MS } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { computeCharStaggerDelays } from 'uniswap/src/components/AnimatedNumber/utils/computeCharStaggerDelays'
import { splitValueIntoChars } from 'uniswap/src/components/AnimatedNumber/utils/splitValueIntoChars'

interface UseAnimatedNumberCharsParams {
  value: string | undefined
  commonPrefixLength: number
  isRightToLeft: boolean
}

export function useAnimatedNumberChars({ value, commonPrefixLength, isRightToLeft }: UseAnimatedNumberCharsParams): {
  chars: string[]
  charDelays: number[]
  charShouldAnimate: boolean[]
} {
  const chars = useMemo(() => splitValueIntoChars(value), [value])
  const { charDelays, charShouldAnimate } = useMemo(
    () => computeCharStaggerDelays({ chars, commonPrefixLength, isRightToLeft, staggerMs: STAGGER_MS }),
    [chars, commonPrefixLength, isRightToLeft],
  )
  return { chars, charDelays, charShouldAnimate }
}
