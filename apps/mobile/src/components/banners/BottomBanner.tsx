import React from 'react'
import { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { ColorTokens, Flex, Text, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'

export const BANNER_HEIGHT = 45

type BottomBannerProps = {
  text: string
  icon?: JSX.Element
  backgroundColor?: ColorTokens
  translateY?: number
  onDismiss?: () => void
}

export function BottomBanner({ text, icon, backgroundColor, translateY, onDismiss }: BottomBannerProps): JSX.Element {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        // need to check for undefined since 0 is falsy
        translateY: withTiming(translateY !== undefined ? -1 * translateY : -1 * BANNER_HEIGHT, {
          duration: 200,
        }),
      },
    ],
  }))

  return (
    <AnimatedFlex
      row
      alignContent="center"
      alignItems="center"
      alignSelf="stretch"
      backgroundColor={backgroundColor ? backgroundColor : '$accent1'}
      borderColor="$surface3"
      borderRadius="$rounded8"
      borderWidth="$spacing1"
      bottom={0}
      entering={FadeIn}
      exiting={FadeOut}
      gap="$spacing12"
      height={BANNER_HEIGHT}
      justifyContent="flex-start"
      left={0}
      mx="$spacing12"
      p="$spacing8"
      position="absolute"
      right={0}
      style={animatedStyle}
      zIndex="$modal"
    >
      {icon}
      <Flex fill row alignItems="center" justifyContent="space-between">
        <Text variant="body2">{text}</Text>
        {onDismiss && (
          <TouchableArea hitSlop={8} onPress={onDismiss}>
            <X color="$neutral2" size="$icon.16" />
          </TouchableArea>
        )}
      </Flex>
    </AnimatedFlex>
  )
}
