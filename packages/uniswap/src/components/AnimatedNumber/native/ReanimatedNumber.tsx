import { useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { Flex, Text, TextLoaderWrapper, useSporeColors } from 'ui/src'
import { getTextVariantKey } from 'ui/src/theme'
import { STAGGER_MS } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { useResolvedAnimatedNumberColors } from 'uniswap/src/components/AnimatedNumber/hooks/useResolvedAnimatedNumberColors'
import { CompactReanimatedNumber } from 'uniswap/src/components/AnimatedNumber/native/CompactReanimatedNumber'
import { HEADING_TEXT_VARIANT_KEYS } from 'uniswap/src/components/AnimatedNumber/native/constants'
import { HeadingReanimatedNumber } from 'uniswap/src/components/AnimatedNumber/native/HeadingReanimatedNumber'
import type {
  AnimatedNumberTick,
  ReanimatedNumberProps,
  ReanimatedNumberRenderProps,
} from 'uniswap/src/components/AnimatedNumber/native/types'
import { getDigitCellWidth, useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { computeCharStaggerDelays } from 'uniswap/src/components/AnimatedNumber/utils/computeCharStaggerDelays'
import { getAnimatedNumberVariantMetrics } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberVariantMetrics'
import { longestCommonPrefix } from 'uniswap/src/components/AnimatedNumber/utils/longestCommonPrefix'
import { splitValueIntoChars } from 'uniswap/src/components/AnimatedNumber/utils/splitValueIntoChars'
import i18next from 'uniswap/src/i18n'

const NO_TICK: AnimatedNumberTick = {
  gen: 0,
  prevChars: [],
  dir: AnimatedNumberDirection.NONE,
  commonPrefixLength: 0,
  flashColor: undefined,
}

function getDirection(balance: number, prevBalance: number | undefined): AnimatedNumberDirection {
  if (prevBalance === undefined || balance === prevBalance) {
    return AnimatedNumberDirection.NONE
  }
  return balance > prevBalance ? AnimatedNumberDirection.UP : AnimatedNumberDirection.DOWN
}

export const ReanimatedNumber = ({
  numericValue,
  currency,
  value,
  loading = false,
  loadingPlaceholderText = '-',
  shouldFadeDecimals = false,
  warmLoading = false,
  textVariant = '$heading2',
  color,
  alignRight = false,
  EndElement,
  endElementGap,
  containerTestID,
  isRightToLeft: isRightToLeftProp,
  forceDirection,
}: ReanimatedNumberProps): JSX.Element => {
  const colors = useSporeColors()
  const { variantFont, digitHeight, maxDigitWidthScaled } = useMemo(
    () => getAnimatedNumberVariantMetrics(textVariant),
    [textVariant],
  )
  const digitCellWidth = useMemo(() => getDigitCellWidth(maxDigitWidthScaled), [maxDigitWidthScaled])
  const textVariantKey = getTextVariantKey(textVariant)
  const useHeadingTypography = HEADING_TEXT_VARIANT_KEYS.has(textVariantKey)
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  const [reduceMotion, setReduceMotion] = useState(false)

  const isRightToLeft = isRightToLeftProp ?? i18next.dir() === 'rtl'

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => subscription.remove()
  }, [])

  const { baseColor, hasCustomColor, decimalPartColor } = useResolvedAnimatedNumberColors({
    colors,
    color,
    shouldFadeDecimals,
  })

  // The whole tick is derived synchronously in render as one immutable object: direction, changed
  // prefix, outgoing glyphs, and flash color are pure functions of (previous value, new value).
  // No effects or extra commits are involved, so a slot can never see a half-delivered tick — the
  // class of bug where digits animated once on the value commit and again on a follow-up state
  // commit. The ref write is guarded by the value comparison, making it idempotent under
  // StrictMode double-render.
  const lastProcessedRef = useRef<{ value?: string; numericValue?: number; tick: AnimatedNumberTick }>({
    tick: NO_TICK,
  })
  if (numericValue && value && value !== lastProcessedRef.current.value) {
    const previous = lastProcessedRef.current
    const dir = forceDirection ?? getDirection(numericValue, previous.numericValue)
    const showFlash = dir !== AnimatedNumberDirection.NONE && !hasCustomColor && previous.value !== undefined
    lastProcessedRef.current = {
      value,
      numericValue,
      tick: {
        gen: previous.tick.gen + 1,
        prevChars: splitValueIntoChars(previous.value),
        dir,
        commonPrefixLength: longestCommonPrefix(value, previous.value ?? '').length,
        flashColor: showFlash
          ? dir === AnimatedNumberDirection.UP
            ? colors.statusSuccess.val
            : colors.neutral2.val
          : undefined,
      },
    }
  }
  const tick = lastProcessedRef.current.tick

  const chars = useMemo(() => splitValueIntoChars(value), [value])

  const { charDelays, charShouldAnimate } = useMemo(
    () =>
      computeCharStaggerDelays({
        chars,
        commonPrefixLength: tick.commonPrefixLength,
        isRightToLeft,
        staggerMs: STAGGER_MS,
      }),
    [chars, tick.commonPrefixLength, isRightToLeft],
  )

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex borderRadius="$rounded4" flexDirection="row" justifyContent={alignRight ? 'flex-end' : 'flex-start'}>
          <Text allowFontScaling={false} style={[digitTextStyle]} opacity={0}>
            {loadingPlaceholderText}
          </Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  const renderProps: ReanimatedNumberRenderProps = {
    chars,
    tick,
    currency,
    digitHeight,
    digitCellWidth,
    shouldFadeDecimals,
    variantFont,
    baseColor,
    decimalPartColor,
    useHeadingTypography,
    charDelays,
    charShouldAnimate,
    reduceMotion,
  }

  if (HEADING_TEXT_VARIANT_KEYS.has(textVariantKey)) {
    return (
      <HeadingReanimatedNumber
        {...renderProps}
        EndElement={EndElement}
        alignRight={alignRight}
        containerTestID={containerTestID}
        endElementGap={endElementGap}
        value={value}
        warmLoading={warmLoading}
      />
    )
  }

  return (
    <CompactReanimatedNumber
      {...renderProps}
      EndElement={EndElement}
      alignRight={alignRight}
      containerTestID={containerTestID}
      endElementGap={endElementGap}
      value={value}
      warmLoading={warmLoading}
    />
  )
}
