import { useHeaderHeight } from '@react-navigation/elements'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SHORT_SCREEN_HEADER_HEIGHT_RATIO, Screen } from 'src/components/layout/Screen'
import { AnimatedFlex, Flex, SpaceTokens, Text, useDeviceInsets, useMedia } from 'ui/src'
import { fonts } from 'ui/src/theme'
import { isIOS } from 'uniswap/src/utils/platform'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  paddingTop?: SpaceTokens
  childrenGap?: SpaceTokens
  keyboardAvoidingViewEnabled?: boolean
}

export function OnboardingScreen({
  title,
  subtitle,
  children,
  paddingTop = '$none',
  keyboardAvoidingViewEnabled = true,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const headerHeight = useHeaderHeight()
  const insets = useDeviceInsets()
  const media = useMedia()

  const gapSize = media.short ? '$none' : '$spacing16'

  return (
    <Screen
      $short={{ pt: headerHeight * SHORT_SCREEN_HEADER_HEIGHT_RATIO }}
      edges={['right', 'left']}
      pt={headerHeight}>
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        enabled={keyboardAvoidingViewEnabled}
        style={[WrapperStyle.base, { marginBottom: insets.bottom }]}>
        <AnimatedFlex
          grow
          entering={FadeIn}
          exiting={FadeOut}
          gap={gapSize}
          pb="$spacing16"
          px="$spacing16">
          {/* Text content */}
          <Flex centered gap="$spacing12" m="$spacing12">
            {title && (
              <Text
                $short={{ variant: 'subheading1' }}
                allowFontScaling={false}
                pt={paddingTop}
                textAlign="center"
                variant="heading3">
                {title}
              </Text>
            )}
            {subtitle ? (
              <Text
                $short={{ variant: 'body3' }}
                color="$neutral2"
                maxFontSizeMultiplier={media.short ? 1.1 : fonts.body2.maxFontSizeMultiplier}
                textAlign="center"
                variant="body2">
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
