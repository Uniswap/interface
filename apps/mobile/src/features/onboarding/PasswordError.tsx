import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import AlertTriangle from 'ui/src/assets/icons/alert-triangle.svg'

interface PasswordErrorProps {
  errorText: string
  style?: StyleProp<ViewStyle>
}

export function PasswordError({ errorText, style }: PasswordErrorProps): JSX.Element {
  const theme = useAppTheme()

  return (
    <AnimatedFlex centered row gap="spacing8" pt="spacing12" px="spacing8" style={style}>
      <AlertTriangle
        color={theme.colors.statusCritical}
        height={ERROR_ICON_HEIGHT}
        width={ERROR_ICON_HEIGHT}
      />
      <Flex>
        <Text color="statusCritical" variant="bodySmall">
          {errorText}
        </Text>
      </Flex>
    </AnimatedFlex>
  )
}

const ERROR_ICON_HEIGHT = 20
