import { useHeaderHeight } from '@react-navigation/elements'
import { LinearGradient } from 'expo-linear-gradient'
import React, { PropsWithChildren, useState } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Screen } from 'src/components/layout/Screen'
import { Flex, SpaceTokens, Text, flexStyles, useMedia, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { opacify, spacing } from 'ui/src/theme'
import { useKeyboardLayout } from 'uniswap/src/utils/useKeyboardLayout'
import { isIOS } from 'utilities/src/platform'

type OnboardingScreenProps = {
  subtitle?: string
  title: string
  paddingTop?: SpaceTokens
  screenFooter?: JSX.Element
  minHeightWhenKeyboardExpanded?: boolean
}

export function SafeKeyboardOnboardingScreen({
  title,
  subtitle,
  children,
  screenFooter,
  paddingTop = '$none',
  minHeightWhenKeyboardExpanded = true,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const [footerHeight, setFooterHeight] = useState(0)
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
      style={[styles.gradient, { height: headerHeight * (responsiveGradientPadding ?? normalGradientPadding) }]}
    />
  )

  const compact = keyboard.isVisible && keyboard.containerHeight !== 0
  const containerStyle = compact ? styles.compact : styles.expand

  // This makes sure this component behaves just like `behavior="padding"` when
  // there's enough space on the screen to show all components.
  const minHeight = minHeightWhenKeyboardExpanded && compact ? keyboard.containerHeight - footerHeight : 0

  return (
    <Screen edges={['right', 'left', 'bottom']}>
      <KeyboardAvoidingView
        behavior={isIOS ? 'padding' : 'height'}
        contentContainerStyle={containerStyle}
        style={styles.base}
      >
        <ScrollView bounces={false} contentContainerStyle={flexStyles.grow} keyboardShouldPersistTaps="handled">
          <AnimatedFlex
            $short={{ gap: '$none' }}
            entering={FadeIn}
            exiting={FadeOut}
            gap="$spacing16"
            minHeight={minHeight}
            px="$spacing16"
            style={[containerStyle, styles.container, { paddingTop: headerHeight }]}
          >
            {header}
            {page}
          </AnimatedFlex>
        </ScrollView>
        <Flex
          onLayout={({
            nativeEvent: {
              layout: { height },
            },
          }) => {
            setFooterHeight(height)
          }}
        >
          {screenFooter}
        </Flex>
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
