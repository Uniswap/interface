import { useHeaderHeight } from '@react-navigation/elements'
import { LinearGradient } from 'expo-linear-gradient'
import React, { PropsWithChildren } from 'react'
import { StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SafeKeyboardScreen } from 'src/components/layout/SafeKeyboardScreen'
import { Flex, SpaceTokens, Text, useMedia, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { opacify } from 'ui/src/theme'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  paddingTop?: SpaceTokens
  footer?: JSX.Element
  minHeightWhenKeyboardExpanded?: boolean
}

export function SafeKeyboardOnboardingScreen({
  title,
  subtitle,
  children,
  footer,
  paddingTop = '$none',
  minHeightWhenKeyboardExpanded = true,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const headerHeight = useHeaderHeight()
  const colors = useSporeColors()
  const media = useMedia()

  const normalGradientPadding = 1.5
  const responsiveGradientPadding = media.short ? 1.25 : normalGradientPadding

  const topGradient = (
    <LinearGradient
      colors={[colors.surface1.val, opacify(0, colors.surface1.val)]}
      locations={[0.6, 0.8]}
      style={[styles.gradient, { height: headerHeight * (responsiveGradientPadding ?? normalGradientPadding) }]}
    />
  )

  const page = (
    <>
      {title || subtitle ? (
        <Flex gap="$spacing12" m="$spacing12">
          {title && (
            <Text $short={{ variant: 'body1' }} pt={paddingTop} textAlign="center" variant="heading3">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text $short={{ variant: 'body3' }} color="$neutral2" textAlign="center" variant="body2">
              {subtitle}
            </Text>
          )}
        </Flex>
      ) : null}
      <Flex grow justifyContent="space-between">
        {children}
      </Flex>
    </>
  )

  return (
    <SafeKeyboardScreen
      edges={['right', 'left', 'bottom']}
      footer={footer}
      header={topGradient}
      minHeightWhenKeyboardExpanded={minHeightWhenKeyboardExpanded}
    >
      <AnimatedFlex
        $short={{ gap: '$none' }}
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing16"
        style={{ paddingTop: headerHeight }}
      >
        {page}
      </AnimatedFlex>
    </SafeKeyboardScreen>
  )
}

const styles = StyleSheet.create({
  gradient: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
})
