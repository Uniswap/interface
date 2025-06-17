import { useHeaderHeight } from '@react-navigation/elements'
import { LinearGradient } from 'expo-linear-gradient'
import React, { PropsWithChildren } from 'react'
import { ScrollViewProps, StyleSheet } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SafeKeyboardScreen } from 'src/components/layout/SafeKeyboardScreen'
import { Flex, GeneratedIcon, SpaceTokens, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { opacify } from 'ui/src/theme'

type OnboardingScreenProps = {
  subtitle?: string
  title?: string
  Icon?: GeneratedIcon
  paddingTop?: SpaceTokens
  footer?: JSX.Element
  minHeightWhenKeyboardExpanded?: boolean
  onHeaderPress?: () => void
  keyboardDismissMode?: ScrollViewProps['keyboardDismissMode']
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
}: PropsWithChildren<OnboardingScreenProps>): JSX.Element {
  const headerHeight = useHeaderHeight()
  const colors = useSporeColors()
  const media = useMedia()

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
    <SafeKeyboardScreen
      edges={['right', 'left', 'bottom']}
      footer={footer}
      header={
        <LinearGradient
          // Note: must use pointerEvents="none" to prevent the gradient from blocking touch events as it's not styled in a way that respects what you may otherwise expect from the JSX hierarchy
          pointerEvents="none"
          colors={[colors.surface1.val, opacify(0, colors.surface1.val)]}
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
