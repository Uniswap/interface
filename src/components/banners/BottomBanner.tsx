import React, { ReactElement } from 'react'
import { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { AnimatedFlex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

export const BANNER_HEIGHT = 45

export type BottomBannerProps = {
  text: string
  icon?: ReactElement
  backgroundColor?: keyof Theme['colors']
  translateY?: number
}

export function BottomBanner({ text, icon, backgroundColor, translateY }: BottomBannerProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(translateY ? -1 * translateY : -1 * BANNER_HEIGHT, {
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
      backgroundColor={backgroundColor ? backgroundColor : 'accentActive'}
      borderRadius="sm"
      bottom={0}
      gap="sm"
      height={BANNER_HEIGHT}
      justifyContent="flex-start"
      left={0}
      mx="sm"
      p="xs"
      position="absolute"
      right={0}
      style={animatedStyle}
      zIndex="modal">
      {icon}
      <Text variant="bodySmall">{text}</Text>
    </AnimatedFlex>
  )
}
