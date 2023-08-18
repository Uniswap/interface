import { forwardRef } from 'react'
import { GetRef, Input, inputStyles } from 'ui/src'
import { fonts } from 'ui/src/theme'

interface OnboardingInputProps {
  hideInput?: boolean
  onChangeText: (text: string) => void
  onSubmit: () => void
  placeholderText: string
  value?: string
  centered?: boolean
}

export const OnboardingInput = forwardRef<GetRef<typeof Input>, OnboardingInputProps>(
  function _OnboardingInput(
    {
      hideInput = false,
      onChangeText,
      onSubmit,
      placeholderText,
      centered = false,
      ...rest
    }: OnboardingInputProps,
    ref
  ): JSX.Element {
    return (
      <Input
        ref={ref}
        autoFocus
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded12"
        borderWidth={1}
        // @ts-expect-error TODO type and fix
        focusStyle={inputStyles.inputFocus}
        fontSize={fonts.subheadLarge.fontSize}
        height="auto"
        // @ts-expect-error TODO type and fix
        hoverStyle={inputStyles.inputHover}
        paddingHorizontal={centered ? '$spacing60' : '$spacing24'}
        paddingVertical="$spacing24"
        placeholder={placeholderText}
        placeholderTextColor="$neutral3"
        secureTextEntry={hideInput}
        textAlign={centered ? 'center' : 'left'}
        width="100%"
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        {...rest}
      />
    )
  }
)
