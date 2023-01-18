import { useHeaderHeight } from '@react-navigation/elements'
import { useResponsiveProp } from '@shopify/restyle'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

type OnboardingScreenProps = {
  subtitle?: string
  title: string
  paddingTop?: keyof Theme['spacing']
  childrenGap?: keyof Theme['spacing']
  keyboardAvoidingViewEnabled?: boolean
}

export function OnboardingScreen({
  title,
  subtitle,
  children,
  paddingTop = 'none',
  keyboardAvoidingViewEnabled = true,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()

  const subtitleMaxFontScaleMultiplier = useResponsiveProp({
    xs: 1.1,
    sm: theme.textVariants.bodySmall.maxFontSizeMultiplier,
  })

  return (
    <Screen edges={['right', 'left']} style={{ paddingTop: headerHeight }}>
      <KeyboardAvoidingView
        behavior="padding"
        enabled={keyboardAvoidingViewEnabled}
        style={[WrapperStyle.base, { marginBottom: insets.bottom }]}>
        <AnimatedFlex grow entering={FadeIn} exiting={FadeOut} pb="md" px="md">
          {/* Text content */}
          <Flex centered gap="sm" m="sm">
            <Text
              allowFontScaling={false}
              paddingTop={paddingTop}
              textAlign="center"
              variant="headlineSmall">
              {title}
            </Text>
            {subtitle ? (
              <Text
                color="textSecondary"
                maxFontSizeMultiplier={subtitleMaxFontScaleMultiplier}
                textAlign="center"
                variant="bodySmall">
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
