import { Input } from 'ui/src'

interface OnboardingInputProps {
  hideInput?: boolean
  onChangeText: (text: string) => void
  onSubmit: () => void
  placeholderText: string
  value?: string
}

export const OnboardingInput = ({
  hideInput = false,
  onChangeText,
  onSubmit,
  placeholderText,
  ...rest
}: OnboardingInputProps): JSX.Element => {
  return (
    <Input
      autoFocus
      backgroundColor="$background1"
      borderColor="$backgroundOutline"
      borderRadius="$rounded12"
      borderWidth={1}
      focusStyle={inputStyles.inputFocus}
      height="auto"
      hoverStyle={inputStyles.inputHover}
      paddingHorizontal="$spacing24"
      paddingVertical="$spacing24"
      placeholder={placeholderText}
      placeholderTextColor="$textTertiary"
      secureTextEntry={hideInput}
      width="100%"
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      {...rest}
    />
  )
}

const inputStyles = {
  noOutline: { outlineWidth: 0 },
  inputFocus: { borderWidth: 1, borderColor: '$textTertiary', outlineWidth: 0 },
  inputHover: { borderWidth: 1, borderColor: '$background3', outlineWidth: 0 },
}
