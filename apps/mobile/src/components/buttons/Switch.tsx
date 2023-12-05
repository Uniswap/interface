import React from 'react'
import { Switch as BaseSwitch, SwitchProps, ViewProps } from 'react-native'
import { IS_ANDROID } from 'src/constants/globals'
import { Flex, useSporeColors } from 'ui/src'

// TODO(MOB-1518) change to tamagui ui/src Switch

type Props = {
  value: boolean
  onValueChange: (newValue: boolean) => void
  disabled?: boolean
} & ViewProps &
  SwitchProps

// A themed switch toggle
export function Switch({ value, onValueChange, disabled, ...rest }: Props): JSX.Element {
  const colors = useSporeColors()

  const falseThumbColor = IS_ANDROID ? colors.neutral3.val : colors.surface1.val
  const trackColor = colors.accentSoft.val

  return (
    <Flex>
      <BaseSwitch
        disabled={disabled}
        ios_backgroundColor="transparent"
        // TODO(MOB-1226): pull colors from dark/light theme with Tamagui
        thumbColor={value ? colors.accent1.val : falseThumbColor}
        trackColor={{
          false: trackColor,
          true: trackColor,
        }}
        value={value}
        onValueChange={disabled ? undefined : onValueChange}
        {...rest}
      />
    </Flex>
  )
}
