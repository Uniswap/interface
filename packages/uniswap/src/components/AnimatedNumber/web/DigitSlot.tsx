import { useEffect, useRef, useState } from 'react'
import type { ResolvedFontStyle } from 'ui/src/theme'
import {
  ROLL_TRANSITION_MS,
  SLIDE_PERCENT,
  SLOT_PREV_CLEAR_DELAY_MS,
} from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { scheduleSlotTransition, type SlotState } from 'uniswap/src/components/AnimatedNumber/utils/slotScheduler'

const ANIMATION_EASING = 'ease-in-out'

export function DigitSlot({
  digit,
  dir,
  delay,
  color,
  reduceMotion,
  digitHeight,
  variantFont,
  width,
  triggerGen,
}: {
  digit: string
  dir: AnimatedNumberDirection
  /** How many ms after the value change this slot's animation should start. */
  delay: number
  color: string
  reduceMotion: boolean
  digitHeight: number
  variantFont: ResolvedFontStyle
  width: number
  /** Increments each time this slot should animate even if its digit value didn't change. */
  triggerGen?: number
}): JSX.Element {
  const [slot, setSlot] = useState<SlotState>({ current: digit, prev: null, gen: 0 })
  const delayRef = useRef(delay)
  delayRef.current = delay
  const dirRef = useRef(dir)
  dirRef.current = dir

  useEffect(() => {
    if (digit === slot.current) {
      return undefined
    }
    return scheduleSlotTransition({
      delayMs: delayRef.current,
      clearDelayMs: SLOT_PREV_CLEAR_DELAY_MS,
      setSlot,
      computeNext: (s) => {
        if (digit === s.current) {
          return s
        }
        return { current: digit, prev: s.current, gen: s.gen + 1 }
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- delay read via ref; only digit drives transitions
  }, [digit])

  useEffect(() => {
    if (triggerGen == null || dirRef.current === AnimatedNumberDirection.NONE) {
      return undefined
    }
    return scheduleSlotTransition({
      delayMs: delayRef.current,
      clearDelayMs: SLOT_PREV_CLEAR_DELAY_MS,
      setSlot,
      computeNext: (s) => {
        if (digit !== s.current) {
          return s
        }
        return { current: digit, prev: digit, gen: s.gen + 1 }
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- delay/dir read via refs; only triggerGen drives this
  }, [triggerGen])

  const animate = !reduceMotion && dir !== AnimatedNumberDirection.NONE
  const enterAnim = animate ? (dir === AnimatedNumberDirection.UP ? '_anEnterUp' : '_anEnterDown') : undefined
  const exitAnim = animate ? (dir === AnimatedNumberDirection.UP ? '_anExitUp' : '_anExitDown') : undefined
  const animValue = (name: string): string => `${name} ${ROLL_TRANSITION_MS}ms ${ANIMATION_EASING} both`

  const textStyle: React.CSSProperties = {
    fontSize: variantFont.fontSize,
    fontWeight: variantFont.fontWeight,
    lineHeight: `${digitHeight}px`,
    height: digitHeight,
    fontFamily: variantFont.family,
    letterSpacing: variantFont.letterSpacing,
    fontVariantNumeric: 'tabular-nums',
    color,
    transition: reduceMotion ? undefined : 'color 250ms ease',
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <span
      style={
        {
          display: 'inline-flex',
          justifyContent: 'center',
          width,
          height: digitHeight,
          overflow: 'hidden',
          position: 'relative',
          verticalAlign: 'top',
          '--an-slide-pct': `${SLIDE_PERCENT}%`,
        } as React.CSSProperties
      }
    >
      {slot.prev !== null && (
        <span
          key={`p${slot.gen}`}
          style={{
            ...textStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            animation: exitAnim ? animValue(exitAnim) : undefined,
          }}
        >
          {slot.prev}
        </span>
      )}
      <span
        key={`c${slot.gen}`}
        style={{
          ...textStyle,
          position: slot.prev !== null ? 'absolute' : 'relative',
          ...(slot.prev !== null ? { top: 0, left: 0, width: '100%', height: '100%' } : {}),
          animation: slot.prev !== null && enterAnim ? animValue(enterAnim) : undefined,
        }}
      >
        {slot.current}
      </span>
    </span>
  )
}
