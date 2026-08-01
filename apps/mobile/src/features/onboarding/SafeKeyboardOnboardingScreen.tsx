import { useFocusEffect } from '@react-navigation/core'
import { useNavigation } from '@react-navigation/native'
import { LinearGradient } from 'expo-linear-gradient'
import React, { PropsWithChildren, useCallback } from 'react'
import { ScrollViewProps, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { HeaderSkipButton } from 'src/app/navigation/components'
import { SafeKeyboardScreen } from 'src/components/layout/SafeKeyboardScreen'
import { ONBOARDING_HEADER_BAR_HEIGHT, OnboardingHeader } from 'src/features/onboarding/OnboardingHeader'
import { Flex, GeneratedIcon, SpaceTokens, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { opacify } from 'ui/src/theme'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  Icon?: GeneratedIcon
  paddingTop?: SpaceTokens
  footer?: JSX.Element
  minHeightWhenKeyboardExpanded?: boolean
  onHeaderPress?: () => void
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
  onSkip?: () => void
  /**
   * Custom node for the header's right slot. Takes precedence over `onSkip` so callers can
   * render arbitrary actions alongside the back chevron on the left.
   */
  renderHeaderRight?: () => JSX.Element
}

export function SafeKeyboardOnboardingScreen({
  title,
  subtitle,
  Icon,
  children,
  footer,
  paddingTop = '$none',
  minHeightWhenKeyboardExpanded = true,
  onHeaderPress,
  keyboardDismissMode,
  onSkip,
  renderHeaderRight,
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const navigation = useNavigation()
  const insets = useAppInsets()
  const headerHeight = insets.top + ONBOARDING_HEADER_BAR_HEIGHT
  const colors = useSporeColors()
  const media = useMedia()

  // Hide the native header; the back control renders in-screen via <OnboardingHeader/> (see that file).
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false })
    }, [navigation]),
  )

  const renderInScreenHeaderRight = useCallback((): JSX.Element | null => {
    if (renderHeaderRight) {
      return renderHeaderRight()
    }
    if (onSkip) {
      return <HeaderSkipButton onPress={onSkip} />
    }
    return null
  }, [renderHeaderRight, onSkip])

  const normalGradientPadding = 1.5
  const responsiveGradientPadding = media.short ? 1.25 : normalGradientPadding

  const heading = (
    <>
      {title || subtitle ? (
        <Flex gap="$spacing8" m="$spacing12">
          {Icon && (
            <Flex centered mb="$spacing4">
              <Flex centered backgroundColor="$surface3" borderRadius="$rounded8" p="$spacing12">
                <Icon color="$neutral1" size="$icon.18" />
              </Flex>
            </Flex>
          )}
          {title && (
            <Text pt={paddingTop} textAlign="center" variant="subheading1">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text $short={{ variant: 'body3' }} color="$neutral2" textAlign="center" variant="subheading2">
              {subtitle}
            </Text>
          )}
        </Flex>
      ) : null}
    </>
  )
  const aboveChildren = onHeaderPress ? (
    <TouchableArea activeOpacity={1} onPress={onHeaderPress}>
      {heading}
    </TouchableArea>
  ) : (
    heading
  )

  const page = (
    <>
      {aboveChildren}
      <Flex grow justifyContent="space-between">
        {children}
      </Flex>
    </>
  )

  return (
    <Flex fill>
      <SafeKeyboardScreen
        edges={['right', 'left', 'bottom']}
        footer={footer}
        header={
          <LinearGradient
            // Note: must use pointerEvents="none" to prevent the gradient from blocking touch events as it's not styled in a way that respects what you may otherwise expect from the JSX hierarchy
            pointerEvents="none"
            colors={[colors.surface1.get(), opacify(0, colors.surface1.val)]}
            locations={[0.6, 0.8]}
            style={[styles.gradient, { height: headerHeight * responsiveGradientPadding }]}
          />
        }
        keyboardDismissMode={keyboardDismissMode}
        minHeightWhenKeyboardExpanded={minHeightWhenKeyboardExpanded}
      >
        <AnimatedFlex
          grow
          $short={{ gap: '$none' }}
          entering={FadeIn}
          exiting={FadeOut}
          gap="$spacing16"
          style={{ paddingTop: headerHeight }}
        >
          {page}
        </AnimatedFlex>
      </SafeKeyboardScreen>
      <OnboardingHeader renderHeaderRight={renderInScreenHeaderRight} />
    </Flex>
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
