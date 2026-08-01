import { useCallback, useEffect, useMemo, useState } from 'react'
import { Dimensions, type LayoutChangeEvent } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Flex, Shine, useSporeColors } from 'ui/src'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { CharRow } from 'uniswap/src/components/AnimatedNumber/native/CharRow'
import {
  CHAR_SPACE_SIZE,
  DIGIT_MAX_WIDTH,
  SCREEN_WIDTH_BUFFER,
} from 'uniswap/src/components/AnimatedNumber/native/constants'
import { AnimatedFontStyles } from 'uniswap/src/components/AnimatedNumber/native/styles'
import type { ReanimatedNumberRenderProps } from 'uniswap/src/components/AnimatedNumber/native/types'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { TopAndBottomGradient } from 'uniswap/src/components/AnimatedNumber/TopAndBottomGradient/TopAndBottomGradient'
import { isDigitChar } from 'uniswap/src/components/AnimatedNumber/utils/computeCharsSizes'

export const HeadingReanimatedNumber = ({
  alignRight,
  baseColor,
  chars,
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
  tick,
  charDelays,
  charShouldAnimate,
  reduceMotion,
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
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - SCREEN_WIDTH_BUFFER)
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
              baseColor={baseColor}
              charDelays={charDelays}
              chars={chars}
              charShouldAnimate={charShouldAnimate}
              currency={currency}
              decimalPartColor={decimalPartColor}
              digitCellWidth={digitCellWidth}
              digitHeight={digitHeight}
              reduceMotion={reduceMotion}
              shouldFadeDecimals={shouldFadeDecimals}
              tick={tick}
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
