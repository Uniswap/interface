import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Switch as BaseSwitch, SwitchProps, ViewProps } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Flex } from 'ui/src'
import { Theme } from 'ui/src/theme/restyle'

type RestyleProps = SpacingProps<Theme> & SpacingShorthandProps<Theme>

type Props = {
  value: boolean
  onValueChange: (newValue: boolean) => void
  disabled?: boolean
} & RestyleProps &
  ViewProps &
  SwitchProps

// A themed switch toggle
export function Switch({ value, onValueChange, disabled, ...rest }: Props): JSX.Element {
  const theme = useAppTheme()

  return (
    <Flex gap="$none">
      <BaseSwitch
        ios_backgroundColor="transparent"
        // TODO(MOB-1226): pull colors from dark/light theme with Tamagui
        thumbColor={value ? theme.colors.accent1 : theme.colors.surface1}
        trackColor={{
          false: theme.colors.surface4,
          true: theme.colors.surface3,
        }}
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        {...rest}
      />
    </Flex>
  )
}
