import { SpacingProps, SpacingShorthandProps } from '@shopify/restyle'
import React from 'react'
import { Switch as BaseSwitch, SwitchProps, ViewProps } from 'react-native'
import { Flex, useSporeColors } from 'ui/src'
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
  const colors = useSporeColors()

  return (
    <Flex>
      <BaseSwitch
        ios_backgroundColor="transparent"
        // TODO(MOB-1226): pull colors from dark/light theme with Tamagui
        thumbColor={value ? colors.accent1.get() : colors.surface1.get()}
        trackColor={{
          false: colors.surface4.val,
          true: colors.surface3.get(),
        }}
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        {...rest}
      />
    </Flex>
  )
}
