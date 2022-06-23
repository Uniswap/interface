import { useHeaderHeight } from '@react-navigation/elements'
import React, { PropsWithChildren } from 'react'
import { KeyboardAvoidingView, StyleSheet } from 'react-native'
import { Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'

type OnboardingScreenProps = {
  subtitle?: string
  title: string
}

export function OnboardingScreen({
  title,
  subtitle,
  children,
}: PropsWithChildren<OnboardingScreenProps>) {
  const headerHeight = useHeaderHeight()

  return (
    <Screen edges={['right', 'left', 'bottom']}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={WrapperStyle.base}>
        <Flex grow pb="md" px="md">
          {/* Text content */}
          <Flex centered gap="sm" m="sm">
            <Text fontWeight="600" textAlign="center" variant="largeLabel">
              {title}
            </Text>
            {subtitle ? (
              <Text color="textSecondary" textAlign="center" variant="body1">
                {subtitle}
              </Text>
            ) : null}
          </Flex>
          {/* page content */}
          <Flex grow justifyContent="space-between">
            {children}
          </Flex>
        </Flex>
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
