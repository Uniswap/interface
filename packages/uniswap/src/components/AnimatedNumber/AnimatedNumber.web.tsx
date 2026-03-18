import { useMemo } from 'react'
import type { TextStyle, ViewStyle } from 'react-native'
import { Flex, Shine, Text, TextLoaderWrapper, useSporeColors } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { TopAndBottomGradient } from 'uniswap/src/components/AnimatedNumber/TopAndBottomGradient'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export const BALANCE_CHANGE_INDICATION_DURATION = ONE_SECOND_MS / 2

export const NUMBER_ARRAY = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
export const NUMBER_WIDTH_ARRAY = [29, 20, 29, 29, 29, 29, 29, 29, 29, 29]
export const DIGIT_HEIGHT = 40
export const DIGIT_MAX_WIDTH = 29
export const ADDITIONAL_WIDTH_FOR_ANIMATIONS = 8

type AnimatedNumberProps = {
  loadingPlaceholderText: string
  loading: boolean | 'no-shimmer'
  value?: string
  balance?: number
  colorIndicationDuration: number
  shouldFadeDecimals: boolean
  warmLoading: boolean
  disableAnimations?: boolean
  isRightToLeft: boolean
  EndElement?: JSX.Element
}

const AnimatedNumber = ({
  value,
  loading = false,
  loadingPlaceholderText,
  shouldFadeDecimals,
  warmLoading,
  EndElement,
}: AnimatedNumberProps): JSX.Element => {
  const currency = useAppFiatCurrencyInfo()
  const colors = useSporeColors()

  const { wholePart, decimalPart } = useMemo(() => {
    if (!value) {
      return { wholePart: '', decimalPart: '' }
    }
    const parts = value.split(currency.decimalSeparator)
    return {
      wholePart: parts[0] ?? '',
      decimalPart: parts[1] ? currency.decimalSeparator + parts[1] : '',
    }
  }, [value, currency.decimalSeparator])

  if (loading) {
    return (
      <TextLoaderWrapper loadingShimmer={loading !== 'no-shimmer'}>
        <Flex borderRadius="$rounded4" flexDirection="row">
          <Text
            allowFontScaling={false}
            style={[AnimatedFontStyles.fontStyle, { height: DIGIT_HEIGHT, fontFamily: fonts.buttonLabel1.family }]}
            opacity={0}
          >
            {loadingPlaceholderText}
          </Text>
        </Flex>
      </TextLoaderWrapper>
    )
  }

  return (
    <Flex row testID={TestID.PortfolioBalance}>
      <Flex group row alignItems="flex-start" backgroundColor="$surface1" borderRadius="$rounded4">
        <TopAndBottomGradient />
        <Shine disabled={!warmLoading}>
          <Text
            allowFontScaling={false}
            fontFamily="$heading"
            style={[
              AnimatedFontStyles.fontStyle,
              {
                color: colors.neutral1.val,
                height: DIGIT_HEIGHT,
              },
            ]}
          >
            {wholePart}
            {shouldFadeDecimals && decimalPart ? (
              <Text
                fontFamily="$heading"
                style={[
                  AnimatedFontStyles.fontStyle,
                  {
                    color: colors.neutral3.val,
                  },
                ]}
              >
                {decimalPart}
              </Text>
            ) : (
              decimalPart
            )}
          </Text>
        </Shine>
        {EndElement && (
          <Flex height={DIGIT_HEIGHT} justifyContent="center" ml="$spacing4">
            {EndElement}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default AnimatedNumber

interface AnimatedFontStylesType {
  fontStyle: TextStyle
  invisible: TextStyle
}

interface AnimatedCharStylesType {
  wrapperStyle: ViewStyle
}

export const AnimatedCharStyles: AnimatedCharStylesType = {
  wrapperStyle: {
    overflow: 'hidden',
  },
}

export const AnimatedFontStyles: AnimatedFontStylesType = {
  fontStyle: {
    fontSize: fonts.heading2.fontSize,
    fontWeight: '500',
    lineHeight: fonts.heading2.lineHeight,
    top: 1,
  },
  invisible: {
    opacity: 0,
    position: 'absolute',
  },
}
