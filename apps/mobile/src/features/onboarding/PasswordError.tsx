import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { AnimatedFlex, Flex, Text, useSporeColors } from 'ui/src'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'

interface PasswordErrorProps {
  errorText: string
  style?: StyleProp<ViewStyle>
}

export function PasswordError({ errorText, style }: PasswordErrorProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <AnimatedFlex centered row gap="$spacing8" pt="$spacing12" px="$spacing8" style={style}>
      <AlertTriangle
        color={colors.statusCritical.val}
        height={ERROR_ICON_HEIGHT}
        width={ERROR_ICON_HEIGHT}
      />
      <Flex>
        <Text color="$statusCritical" variant="body2">
          {errorText}
        </Text>
      </Flex>
    </AnimatedFlex>
  )
}

const ERROR_ICON_HEIGHT = 20
