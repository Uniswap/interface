import { Switch as BaseSwitch, SwitchProps, ViewProps } from 'react-native'
import { Flex, useSporeColors } from 'ui/src'
import { isAndroid } from 'uniswap/src/utils/platform'

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

  const falseThumbColor = isAndroid ? colors.neutral3.val : colors.surface1.val
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
