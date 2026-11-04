/**
 * Native leg of the Input compat (INFRA-3600): a plain React Native TextInput
 * carrying the legacy Input cascade resolved by useInputVisualState —
 * the ui/src INFRA-3318 rebuild's native leg, re-homed. Focus visual state
 * drives the enumerated focusStyle surface.
 */
import { forwardRef } from 'react'
import {
  type BlurEvent,
  type FocusEvent as NativeFocusEvent,
  TextInput as RNTextInput,
  type TextInputProps as RNTextInputProps,
  type TextStyle,
} from 'react-native'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import type { InputCompatProps } from './props'
import { useInputVisualState } from './shared'

export type { InputCompatProps, InputCompatStyleProps } from './props'

/** Instance type alias kept for consumers doing `forwardRef<Input>` (the legacy alias). */
export type InputCompat = RNTextInput

export const InputCompat = forwardRef<RNTextInput, InputCompatProps>(function InputCompatRender(props, ref) {
  const {
    forwardProps,
    resolvedStyle,
    isEditable,
    placeholderColor,
    selectionColor,
    testID,
    onFocus,
    onBlur,
    setFocused,
  } = useInputVisualState(props)

  // `rows` is the web leg's textarea affordance — RN must not receive it.
  const { rows: _rows, ...nativeRest } = forwardProps

  const handleFocus = (e: NativeFocusEvent): void => {
    setFocused(true)
    onFocus?.(e)
  }
  const handleBlur = (e: BlurEvent): void => {
    setFocused(false)
    onBlur?.(e)
  }

  return (
    <RNTextInput
      ref={ref}
      {...(nativeRest as RNTextInputProps)}
      editable={isEditable}
      placeholderTextColor={placeholderColor}
      selectionColor={selectionColor}
      testID={testID}
      style={resolvedStyle as TextStyle}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
})

InputCompat.displayName = 'InputCompat'

// Legacy color-injecting wrappers (TouchableArea compat) must skip this
// primitive — it styles itself and rejects legacy token guidance.
markMyceliumPrimitive(InputCompat)
