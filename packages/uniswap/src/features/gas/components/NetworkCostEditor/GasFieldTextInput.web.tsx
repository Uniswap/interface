import { Input } from 'ui/src'
import type { GasFieldTextInputProps } from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTextInput'

export function GasFieldTextInput({
  accessibilityLabel,
  autoFocus,
  keyboardType,
  value,
  onChangeText,
}: GasFieldTextInputProps): JSX.Element {
  return (
    <Input
      flex={1}
      accessibilityLabel={accessibilityLabel}
      aria-label={accessibilityLabel}
      autoFocus={autoFocus}
      backgroundColor="$transparent"
      borderWidth={0}
      color="$neutral1"
      fontFamily="$body"
      fontSize="$medium"
      height="auto"
      keyboardType={keyboardType}
      outlineColor="$transparent"
      p="$none"
      placeholderTextColor="$neutral3"
      value={value}
      onChangeText={onChangeText}
    />
  )
}
