/* oxlint-disable max-lines */
import { SCREEN_WIDTH } from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform } from 'react-native'
import type { LayoutChangeEvent, TextStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { Flex, Shine, Text, TextLoaderWrapper, useSporeColors } from 'ui/src'
import { getTextVariantKey, type ResolvedFontStyle, type TextVariantKey } from 'ui/src/theme'
import { fonts } from 'ui/src/theme'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { useBalanceChangeIndication } from 'uniswap/src/components/AnimatedNumber/hooks/useBalanceChangeIndication'
import { useResolvedAnimatedNumberColors } from 'uniswap/src/components/AnimatedNumber/hooks/useResolvedAnimatedNumberColors'
import { AnimatedCharStyles } from 'uniswap/src/components/AnimatedNumber/styles'
import { TopAndBottomGradient } from 'uniswap/src/components/AnimatedNumber/TopAndBottomGradient/TopAndBottomGradient'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'
import { getAnimatedNumberCharKey } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberCharKey'
import { getAnimatedNumberVariantMetrics } from 'uniswap/src/components/AnimatedNumber/utils/getAnimatedNumberVariantMetrics'
import { getCharBaseColor } from 'uniswap/src/components/AnimatedNumber/utils/getCharDisplayColor'
import { splitValueIntoChars } from 'uniswap/src/components/AnimatedNumber/utils/splitValueIntoChars'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const DIGIT_HEIGHT = 40
export const DIGIT_MAX_WIDTH = 29
export const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 8

// Native-specific duration for balance change color indication
export const BALANCE_CHANGE_INDICATION_DURATION = ONE_SECOND_MS * 2

const CHAR_SPACE_SIZE = 2

// Extra breathing room added to each tabular digit cell so glyphs are not visually cramped.
// Mirrors the web implementation (CharCell) so both platforms size digits identically.
const DIGIT_CELL_PADDING_RATIO = 1 / 10

const AnimatedFontStyles = {
  fontStyle: {
    fontSize: fonts.heading2.fontSize,
    // special case for the home screen balance, instead of using the heading2 font weight
    fontWeight: '500',
    lineHeight: fonts.heading2.lineHeight,
    top: 1,
  } satisfies TextStyle,
  invisible: {
    opacity: 0,
    position: 'absolute',
  } satisfies TextStyle,
}

const NativeNumberTextStyles = {
  fontStyle: {
    // Use the button font family for number rendering because android's "Book" variant
    // looks noticeably thinner than the balance text shown elsewhere in this component.
    fontFamily: fonts.buttonLabel1.family,
  } satisfies TextStyle,
}

const StaticNumberStyles = {
  fontStyle: {
    ...NativeNumberTextStyles.fontStyle,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  } satisfies TextStyle,
}

/** Fixed (tabular) width for a single digit cell so layout stays deterministic across digit changes. */
function getDigitCellWidth(maxDigitWidthScaled: number): number {
  return maxDigitWidthScaled + maxDigitWidthScaled * DIGIT_CELL_PADDING_RATIO
}

function useDigitTextStyle({
  variantFont,
  digitHeight,
  useHeadingTypography,
}: {
  variantFont: ResolvedFontStyle
  digitHeight: number
  useHeadingTypography: boolean
}): TextStyle {
  return useMemo(
    () => getNativeAnimatedDigitTextStyle({ variantFont, digitHeight, useHeadingTypography }),
    [variantFont, digitHeight, useHeadingTypography],
  )
}

function getNativeAnimatedDigitTextStyle({
  variantFont,
  digitHeight,
  useHeadingTypography,
}: {
  variantFont: ResolvedFontStyle
  digitHeight: number
  useHeadingTypography: boolean
}): TextStyle {
  return {
    fontSize: variantFont.fontSize,
    fontWeight: (useHeadingTypography ? '500' : variantFont.fontWeight) as TextStyle['fontWeight'],
    lineHeight: variantFont.lineHeight,
    top: 1,
    height: digitHeight,
    fontFamily: useHeadingTypography ? fonts.buttonLabel1.family : variantFont.family,
    ...(Platform.OS === 'android' && !useHeadingTypography ? { includeFontPadding: false } : {}),
  }
}

const RollNumber = ({
  digit,
  nextColor,
  index,
  chars,
  commonPrefixLength,
  shouldFadeDecimals,
  currency,
  digitHeight,
  variantFont,
  digitCellWidth,
  baseColor,
  decimalPartColor,
  useHeadingTypography,
}: {
  chars: string[]
  digit?: string
  nextColor?: string
  index: number
  commonPrefixLength: number
  shouldFadeDecimals: boolean
  currency: FiatCurrencyInfo
  digitHeight: number
  variantFont: ResolvedFontStyle
  digitCellWidth: number
  baseColor: string
  decimalPartColor: string
  useHeadingTypography: boolean
}): JSX.Element => {
  const lastChars = useRef([''])
  const charBaseColor = getCharBaseColor({
    index,
    chars,
    decimalSeparator: currency.decimalSeparator,
    shouldFadeDecimals,
    neutral1Color: baseColor,
    fadedDecimalColor: decimalPartColor,
  })
  const fontColor = useSharedValue(nextColor || charBaseColor)
  const yOffset = useSharedValue(digit && isDigitChar(digit) ? digitHeight * -Number(digit) : 0)
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  useEffect(() => {
    const finishColor = getCharBaseColor({
      index,
      chars,
      decimalSeparator: currency.decimalSeparator,
      shouldFadeDecimals,
      neutral1Color: baseColor,
      fadedDecimalColor: decimalPartColor,
    })
    if (nextColor && index > commonPrefixLength - 1 && chars !== lastChars.current) {
      fontColor.value = withSequence(
        withTiming(nextColor, { duration: 250 }),
        withDelay(50, withTiming(finishColor, { duration: 310 })),
      )
      lastChars.current = chars
    } else {
      fontColor.value = finishColor
    }
  }, [
    digit,
    nextColor,
    index,
    chars,
    baseColor,
    decimalPartColor,
    commonPrefixLength,
    fontColor,
    shouldFadeDecimals,
    currency,
  ])

  const animatedFontStyle = useAnimatedStyle(() => {
    return {
      color: fontColor.value,
    }
  }, [fontColor])

  const numbers = NUMBER_ARRAY.map((char, idx) => {
    return (
      <Animated.Text key={idx} allowFontScaling={false} style={[animatedFontStyle, digitTextStyle]}>
        {char}
      </Animated.Text>
    )
  })

  useEffect(() => {
    if (digit && isDigitChar(digit)) {
      yOffset.value = Number((digitHeight * -Number(digit)).toFixed(2))
    }
  }, [digit, digitHeight, yOffset])

  const animatedWrapperStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withTiming(yOffset.value) }],
    }
  }, [yOffset])

  if (digit && isDigitChar(digit)) {
    // Each digit column is a fixed-width, centered "rail" of 0-9 stacked vertically. The fixed width
    // keeps the row's total width deterministic so it never reflows mid-animation when a digit rolls.
    return (
      <Animated.View style={[animatedWrapperStyle, { width: digitCellWidth, alignItems: 'center' }]}>
        {numbers}
      </Animated.View>
    )
  } else {
    return (
      <Animated.Text allowFontScaling={false} style={[animatedFontStyle, digitTextStyle]}>
        {digit}
      </Animated.Text>
    )
  }
}

const Char = ({
  index,
  chars,
  currency,
  nextColor,
  commonPrefixLength,
  shouldFadeDecimals,
  digitHeight,
  variantFont,
  digitCellWidth,
  baseColor,
  decimalPartColor,
  useHeadingTypography,
}: {
  index: number
  chars: string[]
  currency: FiatCurrencyInfo
  nextColor?: string
  commonPrefixLength: number
  shouldFadeDecimals: boolean
  digitHeight: number
  variantFont: ResolvedFontStyle
  digitCellWidth: number
  baseColor: string
  decimalPartColor: string
  useHeadingTypography: boolean
}): JSX.Element => {
  const char = chars[index]
  const isDigit = char != null && isDigitChar(char)
  const rollNumber = (
    <RollNumber
      baseColor={baseColor}
      chars={chars}
      commonPrefixLength={commonPrefixLength}
      currency={currency}
      decimalPartColor={decimalPartColor}
      digit={char}
      digitCellWidth={digitCellWidth}
      digitHeight={digitHeight}
      index={index}
      nextColor={nextColor}
      shouldFadeDecimals={shouldFadeDecimals}
      useHeadingTypography={useHeadingTypography}
      variantFont={variantFont}
    />
  )

  // Non-digit characters (separators, currency symbols) flow naturally and size to their glyph.
  if (!isDigit) {
    return rollNumber
  }

  // Digit cells are fixed-width and clip the vertical rail so only the active digit shows.
  return (
    <Animated.View style={[{ height: digitHeight, width: digitCellWidth }, AnimatedCharStyles.wrapperStyle]}>
      {rollNumber}
      <TopAndBottomGradient height={digitHeight} />
    </Animated.View>
  )
}

const SCREEN_WIDTH_BUFFER = 50

const HEADING_TEXT_VARIANT_KEYS = new Set<TextVariantKey>(['heading1', 'heading2'])

interface ReanimatedNumberProps extends AnimatedNumberProps {
  currency: FiatCurrencyInfo
}

const StaticNumber = ({
  containerTestID,
  currency,
  shouldFadeDecimals = false,
  textVariant = '$heading2',
  value,
  color,
}: Pick<ReanimatedNumberProps, 'currency' | 'shouldFadeDecimals' | 'textVariant' | 'value' | 'color'> &
  Pick<AnimatedNumberProps, 'containerTestID'>): JSX.Element => {
  const colors = useSporeColors()
  const { baseColor, decimalPartColor } = useResolvedAnimatedNumberColors({
    colors,
    color,
    shouldFadeDecimals,
  })
  const amountOfCurrency = value?.split(currency.decimalSeparator)
  const { digitHeight, variantFont } = useMemo(() => getAnimatedNumberVariantMetrics(textVariant), [textVariant])
  const useHeadingTypography = HEADING_TEXT_VARIANT_KEYS.has(getTextVariantKey(textVariant))
  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  // Keep the static path on native text primitives. On Android, routing this
  // through Tamagui Text uses different font metrics/padding and can introduce clipping.
  return (
    <Animated.Text
      allowFontScaling={false}
      testID={containerTestID}
      style={[
        useHeadingTypography ? AnimatedFontStyles.fontStyle : null,
        useHeadingTypography ? StaticNumberStyles.fontStyle : null,
        digitTextStyle,
        {
          color: baseColor,
        },
      ]}
    >
      {shouldFadeDecimals && amountOfCurrency?.length === 2 ? amountOfCurrency[0] : value}
      {shouldFadeDecimals && amountOfCurrency?.length === 2 && (
        <Animated.Text
          allowFontScaling={false}
          style={[
            useHeadingTypography ? AnimatedFontStyles.fontStyle : null,
            useHeadingTypography ? StaticNumberStyles.fontStyle : null,
            digitTextStyle,
            {
              color: decimalPartColor,
            },
          ]}
        >
          {currency.decimalSeparator}
          {amountOfCurrency[1]}
        </Animated.Text>
      )}
    </Animated.Text>
  )
}

const AnimatedNumber = (props: AnimatedNumberProps): JSX.Element => {
  const currency = useAppFiatCurrencyInfo()

  if (props.disableAnimations) {
    return (
      <StaticNumber
        color={props.color}
        containerTestID={props.containerTestID}
        currency={currency}
        shouldFadeDecimals={props.shouldFadeDecimals ?? false}
        textVariant={props.textVariant}
        value={props.value}
      />
    )
  }

  return <ReanimatedNumber {...props} currency={currency} />
}

type ReanimatedNumberRenderProps = {
  chars: string[]
  commonPrefixLength: number
  currency: FiatCurrencyInfo
  digitHeight: number
  digitCellWidth: number
  balanceChangeColor: string | undefined
  shouldFadeDecimals: boolean
  variantFont: ResolvedFontStyle
  baseColor: string
  decimalPartColor: string
  useHeadingTypography: boolean
}

const ReanimatedNumber = ({
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

  const { nextColor, commonPrefixLength } = useBalanceChangeIndication({
    balance: numericValue,
    value,
    prevValue,
    prevBalance,
    colorIndicationDuration,
    statusSuccessColor: colors.statusSuccess.val,
    neutral2Color: colors.neutral2.val,
    requireTruthyBalanceAndValue: true,
  })
  const { baseColor, decimalPartColor, balanceChangeColor } = useResolvedAnimatedNumberColors({
    colors,
    color,
    shouldFadeDecimals,
    nextColor,
  })

  const chars = useMemo(() => splitValueIntoChars(value), [value])

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

const CharRow = ({
  baseColor,
  chars,
  commonPrefixLength,
  currency,
  decimalPartColor,
  digitCellWidth,
  digitHeight,
  balanceChangeColor,
  shouldFadeDecimals,
  useHeadingTypography,
  variantFont,
}: Pick<
  ReanimatedNumberRenderProps,
  | 'baseColor'
  | 'chars'
  | 'commonPrefixLength'
  | 'currency'
  | 'decimalPartColor'
  | 'digitCellWidth'
  | 'digitHeight'
  | 'balanceChangeColor'
  | 'shouldFadeDecimals'
  | 'useHeadingTypography'
  | 'variantFont'
>): JSX.Element => {
  return (
    <>
      {chars.map((_, index) => (
        <Char
          key={getAnimatedNumberCharKey({
            index,
            charsLength: chars.length,
            signColor: baseColor,
          })}
          baseColor={baseColor}
          chars={chars}
          commonPrefixLength={commonPrefixLength}
          currency={currency}
          decimalPartColor={decimalPartColor}
          digitCellWidth={digitCellWidth}
          digitHeight={digitHeight}
          index={index}
          nextColor={balanceChangeColor}
          shouldFadeDecimals={shouldFadeDecimals}
          useHeadingTypography={useHeadingTypography}
          variantFont={variantFont}
        />
      ))}
    </>
  )
}

const CompactReanimatedNumber = ({
  alignRight,
  baseColor,
  balanceChangeColor,
  chars,
  commonPrefixLength,
  containerTestID,
  currency,
  decimalPartColor,
  digitCellWidth,
  digitHeight,
  EndElement,
  endElementGap,
  shouldFadeDecimals,
  useHeadingTypography,
  value,
  variantFont,
  warmLoading,
}: ReanimatedNumberRenderProps &
  Pick<
    AnimatedNumberProps,
    'EndElement' | 'alignRight' | 'containerTestID' | 'endElementGap' | 'value' | 'warmLoading'
  >): JSX.Element => {
  // Natural flex flow: the row sizes itself to the digit cells + separators, so the container
  // always matches the content width exactly without any measurement or fixed phantom width.
  return (
    <Flex row justifyContent={alignRight ? 'flex-end' : 'flex-start'} alignItems="flex-start" testID={containerTestID}>
      <Shine disabled={!warmLoading}>
        <Flex row style={{ position: 'relative' }}>
          <CharRow
            balanceChangeColor={balanceChangeColor}
            baseColor={baseColor}
            chars={chars}
            commonPrefixLength={commonPrefixLength}
            currency={currency}
            decimalPartColor={decimalPartColor}
            digitCellWidth={digitCellWidth}
            digitHeight={digitHeight}
            shouldFadeDecimals={shouldFadeDecimals}
            useHeadingTypography={useHeadingTypography}
            variantFont={variantFont}
          />
          {/* Keeps the screen-reader/copy value intact since the visible chars are split into cells. */}
          <Animated.Text allowFontScaling={false} style={AnimatedFontStyles.invisible}>
            {value}
          </Animated.Text>
        </Flex>
      </Shine>
      {EndElement && (
        <Flex height={digitHeight} justifyContent="center" style={{ marginLeft: endElementGap ?? CHAR_SPACE_SIZE }}>
          {EndElement}
        </Flex>
      )}
    </Flex>
  )
}

const HeadingReanimatedNumber = ({
  alignRight,
  baseColor,
  balanceChangeColor,
  chars,
  commonPrefixLength,
  containerTestID,
  currency,
  decimalPartColor,
  digitCellWidth,
  digitHeight,
  EndElement,
  endElementGap,
  shouldFadeDecimals,
  useHeadingTypography,
  value,
  variantFont,
  warmLoading,
}: ReanimatedNumberRenderProps &
  Pick<
    AnimatedNumberProps,
    'EndElement' | 'alignRight' | 'containerTestID' | 'endElementGap' | 'value' | 'warmLoading'
  >): JSX.Element => {
  const colors = useSporeColors()
  const scale = useSharedValue(1)

  // Measure the available container width so the balance can scale down to fit (e.g. next to the
  // portfolio chart). This only changes on real layout changes, never per-value, so it never lags
  // behind a digit-count change.
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - SCREEN_WIDTH_BUFFER)
  // Width contributed by non-digit characters (currency symbol, separators). Measured once per
  // unique non-digit composition, which is rare, so the synchronous content-width math below stays
  // accurate without re-measuring on every digit roll.
  const [staticWidth, setStaticWidth] = useState(0)

  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  const digitCount = useMemo(() => chars.reduce((count, char) => (isDigitChar(char) ? count + 1 : count), 0), [chars])
  const nonDigitChars = useMemo(() => chars.filter((char) => !isDigitChar(char)).join(''), [chars])

  // Deterministic and synchronous: digit cells are fixed-width and non-digit width is already
  // measured, so the content width is known the moment the value changes. No async measurement of
  // the full value means the number can never briefly overflow before the width catches up.
  const contentWidth = digitCount * digitCellWidth + staticWidth

  // Reserve room for the EndElement so the number scales to fit alongside it.
  const endElementReservedWidth = EndElement ? (endElementGap ?? 0) + DIGIT_MAX_WIDTH : 0
  const availableWidth = Math.max(containerWidth - endElementReservedWidth, 0)
  const targetScale = contentWidth > 0 && availableWidth > 0 ? Math.min(1, availableWidth / contentWidth) : 1

  const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width
    if (measured > 0) {
      setContainerWidth(measured)
    }
  }, [])

  const onStaticLayout = useCallback((e: LayoutChangeEvent) => {
    setStaticWidth(e.nativeEvent.layout.width)
  }, [])

  useEffect(() => {
    scale.value = withTiming(targetScale)
  }, [targetScale, scale])

  // The layout box width and the content's scale transform are driven by the SAME shared value, so
  // the scaled content always fills its box exactly. The container therefore hugs the content width
  // and the number can never overflow, even mid-scale-animation.
  const boxStyle = useAnimatedStyle(
    () => ({
      width: contentWidth * scale.value,
      height: digitHeight,
    }),
    [contentWidth, digitHeight, scale],
  )

  const contentTransformStyle = useAnimatedStyle(() => {
    // Anchor scaling to the leading edge (left for LTR/left-align, right for right-align) so the
    // number stays pinned to the container edge as it scales.
    const pivotX = (alignRight ? -1 : 1) * (contentWidth / 2)
    return {
      transform: [{ translateX: -pivotX }, { scale: scale.value }, { translateX: pivotX }],
    }
  }, [contentWidth, alignRight, scale])

  return (
    <Flex
      row
      alignItems="center"
      justifyContent={alignRight ? 'flex-end' : 'flex-start'}
      overflow="hidden"
      testID={containerTestID}
      onLayout={onContainerLayout}
    >
      <Shine disabled={!warmLoading}>
        <Animated.View style={boxStyle}>
          <Animated.View
            style={[
              contentTransformStyle,
              {
                position: 'absolute',
                top: 0,
                ...(alignRight ? { right: 0 } : { left: 0 }),
                flexDirection: 'row',
                alignItems: 'flex-start',
                backgroundColor: colors.surface1.val,
                borderRadius: 4,
              },
            ]}
          >
            <TopAndBottomGradient height={digitHeight} />
            <CharRow
              balanceChangeColor={balanceChangeColor}
              baseColor={baseColor}
              chars={chars}
              commonPrefixLength={commonPrefixLength}
              currency={currency}
              decimalPartColor={decimalPartColor}
              digitCellWidth={digitCellWidth}
              digitHeight={digitHeight}
              shouldFadeDecimals={shouldFadeDecimals}
              useHeadingTypography={useHeadingTypography}
              variantFont={variantFont}
            />
          </Animated.View>
        </Animated.View>
      </Shine>
      {EndElement && (
        <Flex height={digitHeight} justifyContent="center" style={{ marginLeft: endElementGap ?? CHAR_SPACE_SIZE }}>
          {EndElement}
        </Flex>
      )}
      {/* Invisible, out-of-flow measurer for the non-digit portion only. Updates rarely (when the
          currency symbol or separator layout changes), keeping the content-width math accurate. */}
      <Animated.Text
        allowFontScaling={false}
        style={[AnimatedFontStyles.invisible, digitTextStyle]}
        onLayout={onStaticLayout}
      >
        {nonDigitChars}
      </Animated.Text>
      {/* Keeps the screen-reader/copy value intact since the visible chars are split into cells. */}
      <Animated.Text allowFontScaling={false} style={AnimatedFontStyles.invisible}>
        {value}
      </Animated.Text>
    </Flex>
  )
}

export default AnimatedNumber
