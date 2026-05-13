import { useEffect } from 'react'
import type { TextInput } from 'react-native'
import { Flex, Input } from 'ui/src'
import type { DigitInputRowProps } from 'uniswap/src/components/passkey/recovery/DigitInputRow.types'

/**
 * Native digit input row. Each cell is a single-character controlled Tamagui `Input`.
 * Focus forwarding and Backspace navigation work through `useDigitInput`'s shared
 * handlers — the row just wires React Native events to the platform-agnostic callbacks.
 *
 * Clipboard paste is intentionally not wired: RN TextInput doesn't expose a paste event,
 * and the OTP paste UX is uncommon on native. Users can tap each cell individually.
 */
export function DigitInputRow({
  digits,
  refs,
  onChange,
  onKeyDown,
  inputType = 'text',
  autoFocus = false,
  disabled = false,
}: DigitInputRowProps): JSX.Element {
  // Mirror the web autofocus behavior: focus the first cell on mount.
  useEffect(() => {
    if (autoFocus) {
      refs.current[0]?.focus()
    }
    // autoFocus is static for the lifetime of the component; only run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Flex row gap="$gap8" justifyContent="center" alignSelf="stretch">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el: TextInput | null) => {
            refs.current[index] = el
          }}
          value={digit}
          disabled={disabled}
          secureTextEntry={inputType === 'password'}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          flex={1}
          minWidth={0}
          height={60}
          fontSize={20}
          fontWeight="$medium"
          backgroundColor="$surface2"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded16"
          color="$neutral1"
          focusStyle={{ borderColor: '$neutral1', borderWidth: 1.5 }}
          onChangeText={(v) => onChange(index, v)}
          onKeyPress={(e) => onKeyDown(index, { key: e.nativeEvent.key })}
        />
      ))}
    </Flex>
  )
}
