import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'

export function computeCharStaggerDelays({
  chars,
  commonPrefixLength,
  isRightToLeft,
  staggerMs,
}: {
  chars: string[]
  commonPrefixLength: number
  isRightToLeft: boolean
  staggerMs: number
}): { charDelays: number[]; charShouldAnimate: boolean[] } {
  const delays: number[] = new Array(chars.length).fill(0)
  const shouldAnimate: boolean[] = new Array(chars.length).fill(false)

  let anchorIdx = -1
  for (let i = commonPrefixLength; i < chars.length; i++) {
    const c = chars[i]
    if (c && isDigitChar(c)) {
      if (!isRightToLeft) {
        anchorIdx = i
        break
      }
      anchorIdx = i
    }
  }

  if (anchorIdx === -1) {
    return { charDelays: delays, charShouldAnimate: shouldAnimate }
  }

  const animatedPositions: number[] = []
  const rangeStart = isRightToLeft ? 0 : anchorIdx
  const rangeEnd = isRightToLeft ? anchorIdx : chars.length - 1
  for (let i = rangeStart; i <= rangeEnd; i++) {
    const char = chars[i]
    if (char !== undefined && isDigitChar(char)) {
      animatedPositions.push(i)
    }
  }

  const total = animatedPositions.length
  animatedPositions.forEach((charIdx, seqIdx) => {
    delays[charIdx] = (isRightToLeft ? total - 1 - seqIdx : seqIdx) * staggerMs
    shouldAnimate[charIdx] = true
  })

  return { charDelays: delays, charShouldAnimate: shouldAnimate }
}
