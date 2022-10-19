import React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import { AnimatedFlex } from 'src/components/layout'
import { Text } from 'src/components/Text'

interface PasswordErrorProps {
  errorText: string
  style?: StyleProp<ViewStyle>
}

export function PasswordError({ errorText, style }: PasswordErrorProps) {
  const theme = useAppTheme()

  return (
    <AnimatedFlex row alignItems="center" justifyContent="center" py="sm" style={style}>
      <AlertTriangle
        color={theme.colors.accentFailure}
        height={ERROR_ICON_HEIGHT}
        width={ERROR_ICON_HEIGHT}
      />
      <Text color="accentFailure" textAlign="center" variant="bodyLarge">
        {errorText}
      </Text>
    </AnimatedFlex>
  )
}

const ERROR_ICON_HEIGHT = 20
