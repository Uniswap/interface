import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { AnimatedFlex, Flex, Text } from 'ui/src'

interface PasswordErrorProps {
  errorText: string
  style?: StyleProp<ViewStyle>
}

export function PasswordError({ errorText, style }: PasswordErrorProps): JSX.Element {
  return (
    <AnimatedFlex centered row gap="$spacing8" pt="$spacing12" px="$spacing8" style={style}>
      <Flex>
        <Text color="$statusCritical" variant="body3">
          {errorText}
        </Text>
      </Flex>
    </AnimatedFlex>
  )
}
