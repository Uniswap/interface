import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Flex, Shine, Text, TextLoaderWrapper, useSporeColors } from 'ui/src'
import { getTextVariantKey, type TextVariantKey } from 'ui/src/theme'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useBalanceChangeIndication } from 'uniswap/src/components/AnimatedNumber/hooks/useBalanceChangeIndication'
import { useResolvedAnimatedNumberColors } from 'uniswap/src/components/AnimatedNumber/hooks/useResolvedAnimatedNumberColors'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'
import { getAnimatedNumberVariantMetrics } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberVariantMetrics'
import { CUSTOM_COLOR_FADED_DECIMAL_OPACITY } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import { splitValueIntoChars } from 'uniswap/src/components/AnimatedNumber/utils/splitValueIntoChars'
import { STAGGER_MS } from 'uniswap/src/components/AnimatedNumber/web/animationConfig'
import { CharCell } from 'uniswap/src/components/AnimatedNumber/web/CharCell'
import { computeCharStaggerDelays } from 'uniswap/src/components/AnimatedNumber/web/computeCharStaggerDelays'
import {
  ANIMATED_NUMBER_CSS_RULE_ID,
  ANIMATED_NUMBER_KEYFRAMES_CSS,
} from 'uniswap/src/components/AnimatedNumber/web/keyframes'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import i18next from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePrevious } from 'utilities/src/react/hooks'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const BALANCE_CHANGE_INDICATION_DURATION = ONE_SECOND_MS / 2

const ICON_LEFT_MARGIN = 4
const HEADING_TEXT_VARIANT_KEYS = new Set<TextVariantKey>(['heading1', 'heading2'])

function AnimatedNumberFallback({
  value,
  loading = false,
  loadingPlaceholderText = '-',
  shouldFadeDecimals = false,
  warmLoading = false,
  textVariant = '$heading2',
  color,
  containerTestID = TestID.AnimatedNumber,
  alignRight = false,
  ellipsis = false,
  disableAnimations = false,
  EndElement,
  endElementGap,
}: AnimatedNumberProps): JSX.Element {
  const currency = useAppFiatCurrencyInfo()
  const textVariantKey = getTextVariantKey(textVariant)
  const { digitHeight } = useMemo(() => getAnimatedNumberVariantMetrics(textVariant), [textVariant])

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex borderRadius="$rounded4" flexDirection="row" justifyContent={alignRight ? 'flex-end' : 'flex-start'}>
          <Text allowFontScaling={false} variant={textVariantKey} style={{ height: digitHeight, top: 1 }} opacity={0}>
            {loadingPlaceholderText}
          </Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  const ellipsisProps = ellipsis
    ? ({ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as const)
    : {}

  const tabularStyle = disableAnimations ? ({ fontVariantNumeric: 'tabular-nums' } as const) : undefined

  const amountParts = value?.split(currency.decimalSeparator)
  const textContent =
    shouldFadeDecimals && amountParts?.length === 2 ? (
      color !== undefined ? (
        <Text variant={textVariantKey} color={color} style={tabularStyle} {...ellipsisProps}>
          {amountParts[0]}
          <Text variant={textVariantKey} color={color} opacity={CUSTOM_COLOR_FADED_DECIMAL_OPACITY / 100}>
            {currency.decimalSeparator}
            {amountParts[1]}
          </Text>
        </Text>
      ) : (
        <Text variant={textVariantKey} color={color} style={tabularStyle} {...ellipsisProps}>
          {amountParts[0]}
          <Text variant={textVariantKey} color="$neutral2">
            {currency.decimalSeparator}
            {amountParts[1]}
          </Text>
        </Text>
      )
    ) : (
      <Text variant={textVariantKey} color={color} style={tabularStyle} {...ellipsisProps}>
        {value}
      </Text>
    )

  const content = <Shine disabled={!warmLoading}>{textContent}</Shine>

  return (
    <Flex
      row
      justifyContent={alignRight ? 'flex-end' : 'flex-start'}
      overflow={ellipsis ? 'hidden' : undefined}
      testID={containerTestID}
    >
      {content}
      {EndElement && (
        <Flex height={digitHeight} justifyContent="center" style={{ marginLeft: endElementGap ?? ICON_LEFT_MARGIN }}>
          {EndElement}
        </Flex>
      )}
    </Flex>
  )
}

export function AnimatedNumberCore({
  value,
  numericValue,
  loading = false,
  loadingPlaceholderText = '-',
  shouldFadeDecimals = false,
  warmLoading = false,
  colorIndicationDuration = BALANCE_CHANGE_INDICATION_DURATION,
  isRightToLeft: isRightToLeftProp,
  textVariant = '$heading2',
  color,
  containerTestID = TestID.AnimatedNumber,
  alignRight = false,
  EndElement,
  endElementGap,
}: AnimatedNumberProps): JSX.Element {
  useInjectSingleStylesheet({ id: ANIMATED_NUMBER_CSS_RULE_ID, css: ANIMATED_NUMBER_KEYFRAMES_CSS })

  const isRightToLeft = isRightToLeftProp ?? i18next.dir() === 'rtl'
  const currency = useAppFiatCurrencyInfo()
  const colors = useSporeColors()
  const prevValue = usePrevious(value)
  const prevBalance = usePrevious(numericValue)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [animateGen, setAnimateGen] = useState(0)
  const dirRef = useRef<AnimatedNumberDirection>(AnimatedNumberDirection.NONE)

  const textVariantKey = getTextVariantKey(textVariant)
  const { variantFont, digitHeight, maxDigitWidthScaled } = useMemo(
    () => getAnimatedNumberVariantMetrics(textVariant),
    [textVariant],
  )
  const compact = !HEADING_TEXT_VARIANT_KEYS.has(textVariantKey)
  const { nextColor, commonPrefixLength } = useBalanceChangeIndication({
    balance: numericValue,
    value,
    prevValue,
    prevBalance,
    colorIndicationDuration,
    statusSuccessColor: colors.statusSuccess.val,
    neutral2Color: colors.neutral2.val,
    onDirectionChange: (direction) => {
      dirRef.current = direction
    },
    onAnimate: () => {
      setAnimateGen((generation) => generation + 1)
    },
  })
  const { baseColor, decimalPartColor, balanceChangeColor } = useResolvedAnimatedNumberColors({
    colors,
    color,
    shouldFadeDecimals,
    nextColor,
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduceMotion(mq.matches)
    const handler = (event: MediaQueryListEvent): void => setReduceMotion(event.matches)
    mq.addEventListener('change', handler)
    // eslint-disable-next-line consistent-return -- cleanup required for listener
    return () => mq.removeEventListener('change', handler)
  }, [])

  const chars = useMemo(() => splitValueIntoChars(value), [value])

  const { charDelays, charShouldAnimate } = useMemo(
    () =>
      computeCharStaggerDelays({
        chars,
        commonPrefixLength,
        isRightToLeft,
        staggerMs: STAGGER_MS,
      }),
    [chars, commonPrefixLength, isRightToLeft],
  )

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex borderRadius="$rounded4" flexDirection="row" justifyContent={alignRight ? 'flex-end' : 'flex-start'}>
          <Text allowFontScaling={false} variant={textVariantKey} style={{ height: digitHeight, top: 1 }} opacity={0}>
            {loadingPlaceholderText}
          </Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  return (
    <Flex
      row
      alignItems={compact ? undefined : 'center'}
      backgroundColor={compact ? undefined : '$surface1'}
      borderRadius={compact ? undefined : '$rounded4'}
      justifyContent={alignRight ? 'flex-end' : 'flex-start'}
      testID={containerTestID}
    >
      <Shine disabled={!warmLoading}>
        <Flex row animation="fast" style={{ position: 'relative' }}>
          {chars.map((_, index) => (
            <CharCell
              key={getAnimatedNumberCharKey({
                index,
                charsLength: chars.length,
                signColor: baseColor,
              })}
              animateGen={animateGen}
              baseColor={baseColor}
              chars={chars}
              commonPrefixLength={commonPrefixLength}
              currency={currency}
              decimalPartColor={decimalPartColor}
              delay={charDelays[index] ?? 0}
              digitHeight={digitHeight}
              dir={dirRef.current}
              index={index}
              maxDigitWidthScaled={maxDigitWidthScaled}
              nextColor={balanceChangeColor}
              reduceMotion={reduceMotion}
              shouldFadeDecimals={shouldFadeDecimals}
              shouldForceAnimate={charShouldAnimate[index] ?? false}
              showEdgeFade={!compact}
              textVariantKey={textVariantKey}
              variantFont={variantFont}
            />
          ))}
        </Flex>
      </Shine>
      {EndElement && (
        <Flex height={digitHeight} justifyContent="center" style={{ marginLeft: endElementGap ?? ICON_LEFT_MARGIN }}>
          {EndElement}
        </Flex>
      )}
    </Flex>
  )
}

const AnimatedNumber = (props: AnimatedNumberProps): JSX.Element => {
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  if (!isDataLivelinessEnabled || props.disableAnimations) {
    return <AnimatedNumberFallback {...props} />
  }

  return <AnimatedNumberCore {...props} />
}

export default AnimatedNumber
