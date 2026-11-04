import { spacing, fonts } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { useEffect, useRef } from 'react'
import type { TextInput } from 'react-native'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { BottomSheetTextInput } from 'uniswap/src/components/modals/Modal'
import type { ChangeUnitagTextInputProps } from 'wallet/src/features/unitags/ChangeUnitagTextInput'

export function ChangeUnitagTextInput({
  autoFocus,
  value,
  onChangeText,
  onSubmitEditing,
}: ChangeUnitagTextInputProps): JSX.Element {
  const colors = useSporeColors()
  const { isSheetReady } = useBottomSheetContext()
  const inputRef = useRef<TextInput>(null)

  // Focus after the sheet begins animating: autofocus at mount races the sheet open,
  // leaving it parked behind the keyboard (gorhom only lifts the sheet once a
  // BottomSheetTextInput registers focus while the sheet has detents).
  useEffect(() => {
    if (autoFocus && isSheetReady) {
      inputRef.current?.focus()
    }
  }, [autoFocus, isSheetReady])

  return (
    <BottomSheetTextInput
      ref={inputRef}
      autoCapitalize="none"
      maxLength={20}
      numberOfLines={1}
      returnKeyType="done"
      style={{
        width: '100%',
        color: colors.neutral1.val,
        fontSize: fonts.subheading1.fontSize,
        fontFamily: fonts.subheading1.family,
        margin: spacing.none,
        paddingHorizontal: spacing.none,
        paddingVertical: spacing.spacing20,
      }}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
    />
  )
}
