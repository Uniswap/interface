import { forwardRef, useEffect } from 'react'
import { Input, InputProps, Input as TextInputBase, useSporeColors } from 'ui/src'
import { isWebApp } from 'utilities/src/platform'

export type TextInputProps = InputProps

// TODO(MOB-1537): move this to ui/src and see if we can just use styled() or move entirely to Input

export const TextInput = forwardRef<TextInputBase, TextInputProps>(function _TextInput(
  { onChangeText, onBlur, ...rest },
  ref,
) {
  const colors = useSporeColors()

  // biome-ignore lint/correctness/useExhaustiveDependencies: -ref, -ref.current (only run on mount since we only need to set this once)
  useEffect(() => {
    // Ensure virtualkeyboardpolicy is set to "auto" on the DOM element
    // otherwise the virtual keyboard will not show on android mobile
    // TODO (WEB-5798): remove tamagui input hack
    if (ref && 'current' in ref && ref.current && isWebApp) {
      const inputElement = ref.current as unknown as HTMLElement
      inputElement.setAttribute('virtualkeyboardpolicy', 'auto')
    }
  }, []) // only run on mount since we only need to set this once

  return (
    <Input
      ref={ref}
      autoComplete="off"
      backgroundColor="$surface1"
      borderRadius="$rounded12"
      color="$neutral1"
      height="auto"
      placeholderTextColor="$neutral3"
      px="$spacing16"
      py="$spacing12"
      selectionColor={colors.neutral3.val}
      onBlur={onBlur}
      onChangeText={onChangeText}
      {...rest}
    />
  )
})
