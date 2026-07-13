import { useEffect, useRef, useState } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import type { ResolvedFontStyle } from 'ui/src/theme'
import {
  ROLL_TRANSITION_MS,
  SLIDE_PERCENT,
  SLOT_PREV_CLEAR_DELAY_MS,
} from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { scheduleSlotTransition, type SlotState } from 'uniswap/src/components/AnimatedNumber/utils/slotScheduler'

export function DigitSlot({
  digit,
  dir,
  delay,
  color,
  reduceMotion,
  digitHeight,
  variantFont,
  useHeadingTypography,
  triggerGen,
}: {
  digit: string
  dir: AnimatedNumberDirection
  delay: number
  color: string
  reduceMotion: boolean
  digitHeight: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
  triggerGen?: number
}): JSX.Element {
  const [slot, setSlot] = useState<SlotState>({ current: digit, prev: null, gen: 0 })
  const delayRef = useRef(delay)
  delayRef.current = delay
  const dirRef = useRef(dir)
  dirRef.current = dir
  const reduceMotionRef = useRef(reduceMotion)
  reduceMotionRef.current = reduceMotion
  const digitHeightRef = useRef(digitHeight)
  digitHeightRef.current = digitHeight

  const prevTranslateY = useSharedValue(0)
  const prevOpacity = useSharedValue(0)
  const currentTranslateY = useSharedValue(0)
  const currentOpacity = useSharedValue(1)
  const fontColor = useSharedValue(color)

  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

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

  useEffect(() => {
    const animate = !reduceMotionRef.current && dirRef.current !== AnimatedNumberDirection.NONE

    if (!animate || slot.prev === null) {
      currentTranslateY.value = 0
      currentOpacity.value = 1
      prevOpacity.value = 0
      return
    }

    const slideAmount = (SLIDE_PERCENT / 100) * digitHeightRef.current
    const isUp = dirRef.current === AnimatedNumberDirection.UP

    // Set start positions (synchronous, no animation)
    currentTranslateY.value = isUp ? slideAmount : -slideAmount
    currentOpacity.value = 0
    prevTranslateY.value = 0
    prevOpacity.value = 1

    // Animate to end positions
    currentTranslateY.value = withTiming(0, { duration: ROLL_TRANSITION_MS })
    currentOpacity.value = withTiming(1, { duration: ROLL_TRANSITION_MS })
    prevTranslateY.value = withTiming(isUp ? -slideAmount : slideAmount, { duration: ROLL_TRANSITION_MS })
    prevOpacity.value = withTiming(0, { duration: ROLL_TRANSITION_MS })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reduceMotion/dir/digitHeight read via refs; only gen drives animation
  }, [slot.gen])

  useEffect(() => {
    fontColor.value = withTiming(color, { duration: 250 })
  }, [color, fontColor])

  const animatedPrevStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: prevTranslateY.value }],
    opacity: prevOpacity.value,
    color: fontColor.value,
  }))

  const animatedCurrentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: currentTranslateY.value }],
    opacity: currentOpacity.value,
    color: fontColor.value,
  }))

  const absoluteStyle = { position: 'absolute', top: 1, width: '100%', textAlign: 'center' } as const

  return (
    <>
      {slot.prev !== null && (
        <Animated.Text allowFontScaling={false} style={[digitTextStyle, animatedPrevStyle, absoluteStyle]}>
          {slot.prev}
        </Animated.Text>
      )}
      <Animated.Text
        allowFontScaling={false}
        style={[digitTextStyle, animatedCurrentStyle, slot.prev !== null ? absoluteStyle : undefined]}
      >
        {slot.current}
      </Animated.Text>
    </>
  )
}
