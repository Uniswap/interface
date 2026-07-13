import { useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import { Flex, Text, TextLoaderWrapper, useSporeColors } from 'ui/src'
import { getTextVariantKey } from 'ui/src/theme'
import { BALANCE_CHANGE_INDICATION_DURATION, STAGGER_MS } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { useBalanceChangeIndication } from 'uniswap/src/components/AnimatedNumber/hooks/useBalanceChangeIndication'
import { useResolvedAnimatedNumberColors } from 'uniswap/src/components/AnimatedNumber/hooks/useResolvedAnimatedNumberColors'
import { CompactReanimatedNumber } from 'uniswap/src/components/AnimatedNumber/native/CompactReanimatedNumber'
import { HEADING_TEXT_VARIANT_KEYS } from 'uniswap/src/components/AnimatedNumber/native/constants'
import { HeadingReanimatedNumber } from 'uniswap/src/components/AnimatedNumber/native/HeadingReanimatedNumber'
import type {
  ReanimatedNumberProps,
  ReanimatedNumberRenderProps,
} from 'uniswap/src/components/AnimatedNumber/native/types'
import { getDigitCellWidth, useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { computeCharStaggerDelays } from 'uniswap/src/components/AnimatedNumber/utils/computeCharStaggerDelays'
import { getAnimatedNumberVariantMetrics } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberVariantMetrics'
import { splitValueIntoChars } from 'uniswap/src/components/AnimatedNumber/utils/splitValueIntoChars'
import i18next from 'uniswap/src/i18n'
import { usePrevious } from 'utilities/src/react/hooks'

export const ReanimatedNumber = ({
  numericValue,
  currency,
  value,
  loading = false,
  loadingPlaceholderText = '-',
  colorIndicationDuration = BALANCE_CHANGE_INDICATION_DURATION,
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
  const prevValue = usePrevious(value)
  const prevBalance = usePrevious(numericValue)

  const colors = useSporeColors()
  const { variantFont, digitHeight, maxDigitWidthScaled } = useMemo(
    () => getAnimatedNumberVariantMetrics(textVariant),
    [textVariant],
  )
  const digitCellWidth = useMemo(() => getDigitCellWidth(maxDigitWidthScaled), [maxDigitWidthScaled])
  const textVariantKey = getTextVariantKey(textVariant)
  const useHeadingTypography = HEADING_TEXT_VARIANT_KEYS.has(textVariantKey)
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  const dirRef = useRef<AnimatedNumberDirection>(AnimatedNumberDirection.NONE)
  const [animateGen, setAnimateGen] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  const isRightToLeft = isRightToLeftProp ?? i18next.dir() === 'rtl'

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled)
    })
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => subscription.remove()
  }, [])

  const { nextColor, commonPrefixLength } = useBalanceChangeIndication({
    balance: numericValue,
    value,
    prevValue,
    prevBalance,
    colorIndicationDuration,
    statusSuccessColor: colors.statusSuccess.val,
    neutral2Color: colors.neutral2.val,
    requireTruthyBalanceAndValue: true,
    forceDirection,
    onDirectionChange: (direction) => {
      dirRef.current = direction
    },
    onAnimate: () => setAnimateGen((g) => g + 1),
  })
  const { baseColor, decimalPartColor, balanceChangeColor } = useResolvedAnimatedNumberColors({
    colors,
    color,
    shouldFadeDecimals,
    nextColor,
  })

  const chars = useMemo(() => splitValueIntoChars(value), [value])

  const { charDelays, charShouldAnimate } = useMemo(
    () => computeCharStaggerDelays({ chars, commonPrefixLength, isRightToLeft, staggerMs: STAGGER_MS }),
    [chars, commonPrefixLength, isRightToLeft],
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
    commonPrefixLength,
    currency,
    digitHeight,
    digitCellWidth,
    balanceChangeColor,
    shouldFadeDecimals,
    variantFont,
    baseColor,
    decimalPartColor,
    useHeadingTypography,
    dir: dirRef.current,
    charDelays,
    charShouldAnimate,
    animateGen,
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
