import { useHeaderHeight } from '@react-navigation/elements'
import { LinearGradient } from 'expo-linear-gradient'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Screen } from 'src/components/layout/Screen'
import { AnimatedFlex, Flex, SpaceTokens, Text, flexStyles, useMedia, useSporeColors } from 'ui/src'
import { opacify, spacing } from 'ui/src/theme'
import { isIOS } from 'uniswap/src/utils/platform'
import { useKeyboardLayout } from 'wallet/src/utils/useKeyboardLayout'

type OnboardingScreenProps = {
  subtitle?: string
  title: string
  paddingTop?: SpaceTokens
}

export function SafeKeyboardOnboardingScreen({
  title,
  subtitle,
  children,
  paddingTop = '$none',
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const headerHeight = useHeaderHeight()
  const colors = useSporeColors()
  const media = useMedia()
  const keyboard = useKeyboardLayout()

  const header = (
    <Flex gap="$spacing12" m="$spacing12">
      <Text $short={{ variant: 'body1' }} pt={paddingTop} textAlign="center" variant="heading3">
        {title}
      </Text>
      {subtitle ? (
        <Text $short={{ variant: 'body3' }} color="$neutral2" textAlign="center" variant="body2">
          {subtitle}
        </Text>
      ) : null}
    </Flex>
  )

  const page = (
    <Flex grow justifyContent="space-between">
      {children}
    </Flex>
  )

  const normalGradientPadding = 1.5
  const responsiveGradientPadding = media.short ? 1.25 : normalGradientPadding

  const topGradient = (
    <LinearGradient
      colors={[colors.surface1.val, opacify(0, colors.surface1.val)]}
      locations={[0.6, 0.8]}
      style={[
        styles.gradient,
        { height: headerHeight * (responsiveGradientPadding ?? normalGradientPadding) },
      ]}
    />
  )

  const compact = keyboard.isVisible && keyboard.containerHeight !== 0
  const containerStyle = compact ? styles.compact : styles.expand

  // This makes sure this component behaves just like `behavior="padding"` when
  // there's enough space on the screen to show all components.
  const minHeight = compact ? keyboard.containerHeight : 0

  return (
    <Screen edges={['right', 'left', 'bottom']}>
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : undefined}
        contentContainerStyle={containerStyle}
        style={styles.base}>
        <ScrollView
          bounces={false}
          contentContainerStyle={flexStyles.grow}
          keyboardShouldPersistTaps="handled">
          <AnimatedFlex
            $short={{ gap: '$none' }}
            entering={FadeIn}
            exiting={FadeOut}
            gap="$spacing16"
            minHeight={minHeight}
            px="$spacing16"
            style={[containerStyle, styles.container, { paddingTop: headerHeight }]}>
            {header}
            {page}
          </AnimatedFlex>
        </ScrollView>
      </KeyboardAvoidingView>
      {topGradient}
    </Screen>
  )
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  compact: {
    flexGrow: 0,
  },
  container: {
    paddingBottom: spacing.spacing12,
  },
  expand: {
    flexGrow: 1,
  },
  gradient: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
