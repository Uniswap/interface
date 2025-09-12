import { useFocusEffect } from '@react-navigation/core'
import { useHeaderHeight } from '@react-navigation/elements'
import React, { PropsWithChildren, useCallback } from 'react'
import { BackHandler, StyleSheet } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { HeaderSkipButton, renderHeaderBackButton } from 'src/app/navigation/components'
import { useOnboardingStackNavigation } from 'src/app/navigation/types'
import { Screen, SHORT_SCREEN_HEADER_HEIGHT_RATIO } from 'src/components/layout/Screen'
import { Flex, GeneratedIcon, SpaceTokens, Text, useMedia } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { fonts } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { isIOS } from 'utilities/src/platform'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  Icon?: GeneratedIcon
  paddingTop?: SpaceTokens
  childrenGap?: SpaceTokens
  keyboardAvoidingViewEnabled?: boolean
  disableGoBack?: boolean
  onSkip?: () => void
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
  ignoreContainerPaddingX,
  ignoreTextContainerMarginBottom,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const navigation = useOnboardingStackNavigation()
  const headerHeight = useHeaderHeight()
  const insets = useAppInsets()
  const media = useMedia()
  // TODO(WALL-5483): remove this once we improve seed recovery screen design on smaller devices
  const showIcon = !media.short

  const gapSize = media.short ? '$none' : '$spacing16'

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerLeft: disableGoBack ? (): null => null : renderHeaderBackButton,
        gestureEnabled: !disableGoBack,
        headerRight: !onSkip
          ? (): null => null
          : (_props): JSX.Element => <HeaderSkipButton onPress={() => onSkip()} />,
      })
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        return disableGoBack
      })

      return subscription.remove
    }, [navigation, disableGoBack, onSkip]),
  )

  return (
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
              <Text allowFontScaling={false} pt={paddingTop} textAlign="center" variant="subheading1">
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
  )
}

const WrapperStyle = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
})
