import { useFocusEffect } from '@react-navigation/core'
import { isIOS } from '@universe/environment'
import React, { PropsWithChildren, useCallback } from 'react'
import { BackHandler, StyleSheet } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { HeaderSkipButton } from 'src/app/navigation/components'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { Screen, SHORT_SCREEN_HEADER_HEIGHT_RATIO } from 'src/components/layout/Screen'
import { useRegionalizedLineHeight } from 'src/components/text/useRegionalizedLineHeight'
import { ONBOARDING_HEADER_BAR_HEIGHT, OnboardingHeader } from 'src/features/onboarding/OnboardingHeader'
import { Flex, GeneratedIcon, SpaceTokens, Text, useMedia } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  Icon?: GeneratedIcon
  paddingTop?: SpaceTokens
  childrenGap?: SpaceTokens
  keyboardAvoidingViewEnabled?: boolean
  disableGoBack?: boolean
  onSkip?: () => void
  /**
   * Custom node for the header's right slot. Takes precedence over `onSkip` so callers can
   * render arbitrary actions (e.g., a Help link) alongside the back chevron on the left.
   */
  renderHeaderRight?: () => JSX.Element
  ignoreContainerPaddingX?: boolean
  ignoreTextContainerMarginBottom?: boolean
}

export function OnboardingScreen({
  title,
  subtitle,
  Icon,
  children,
  paddingTop = '$none',
  keyboardAvoidingViewEnabled = true,
  disableGoBack = false,
  onSkip,
  renderHeaderRight,
  ignoreContainerPaddingX,
  ignoreTextContainerMarginBottom,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const navigation = useOnboardingStackNavigation()
  const insets = useAppInsets()
  const headerHeight = insets.top + ONBOARDING_HEADER_BAR_HEIGHT
  const media = useMedia()
  // TODO(WALL-5483): remove this once we improve seed recovery screen design on smaller devices
  const showIcon = !media.short

  const gapSize = media.short ? '$none' : '$spacing16'

  // Header controls render in-screen via <OnboardingHeader/>; the native header stays empty.
  const renderInScreenHeaderRight = useCallback((): JSX.Element | null => {
    if (renderHeaderRight) {
      return renderHeaderRight()
    }
    if (onSkip) {
      return <HeaderSkipButton onPress={onSkip} />
    }
    return null
  }, [renderHeaderRight, onSkip])

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerShown: false,
        gestureEnabled: !disableGoBack,
      })
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        return disableGoBack
      })

      return () => subscription.remove()
    }, [navigation, disableGoBack]),
  )

  const titleLineHeight = useRegionalizedLineHeight()

  return (
    <Flex fill>
      <Screen
        $short={{ pt: headerHeight * SHORT_SCREEN_HEADER_HEIGHT_RATIO }}
        edges={['right', 'left']}
        pt={headerHeight}
      >
        <KeyboardAvoidingView
          behavior={isIOS ? 'padding' : undefined}
          enabled={keyboardAvoidingViewEnabled}
          style={[WrapperStyle.base, { marginBottom: insets.bottom }]}
        >
          <AnimatedFlex
            grow
            entering={FadeIn}
            exiting={FadeOut}
            gap={gapSize}
            pb="$spacing16"
            px={ignoreContainerPaddingX ? undefined : '$spacing16'}
          >
            {/* Text content */}
            <Flex centered gap="$spacing8" m="$spacing12" mb={ignoreTextContainerMarginBottom ? '$none' : undefined}>
              {showIcon && Icon && (
                <Flex centered mb="$spacing4">
                  <Flex centered backgroundColor="$surface3" borderRadius="$rounded8" p="$spacing12">
                    <Icon color="$neutral1" size="$icon.18" />
                  </Flex>
                </Flex>
              )}
              {title && (
                <Text
                  allowFontScaling={false}
                  pt={paddingTop}
                  textAlign="center"
                  variant="subheading1"
                  lineHeight={titleLineHeight}
                >
                  {title}
                </Text>
              )}
              {subtitle ? (
                <Text
                  $short={{ variant: 'body3' }}
                  color="$neutral2"
                  maxFontSizeMultiplier={media.short ? 1.1 : fonts.body2.maxFontSizeMultiplier}
                  textAlign="center"
                  variant="subheading2"
                >
                  {subtitle}
                </Text>
              ) : null}
            </Flex>
            {/* page content */}
            <Flex fill grow justifyContent="space-between">
              {children}
            </Flex>
          </AnimatedFlex>
        </KeyboardAvoidingView>
      </Screen>
      <OnboardingHeader disableGoBack={disableGoBack} renderHeaderRight={renderInScreenHeaderRight} />
    </Flex>
  )
}

const WrapperStyle = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
