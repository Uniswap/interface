import { forwardRef } from 'react'
import { Input as TamaguiInput, InputProps as TamaguiInputProps } from 'ui/src'
import { inputStyles } from 'ui/src/components/input/utils'
import { fonts } from 'ui/src/theme/fonts'

export type InputProps = {
  large?: boolean
  hideInput?: boolean
  centered?: boolean
} & TamaguiInputProps

export type Input = TamaguiInput

export const Input = forwardRef<Input, InputProps>(function _Input(
  { large = false, hideInput = false, centered = false, ...rest }: InputProps,
  ref,
): JSX.Element {
  return (
    <TamaguiInput
      ref={ref}
      backgroundColor={large ? '$surface1' : '$surface2'}
      borderColor="$surface3"
      borderRadius="$rounded16"
      borderWidth="$spacing1"
      focusStyle={inputStyles.inputFocus}
      fontSize={fonts.subheading2.fontSize}
      height="auto"
      hoverStyle={inputStyles.inputHover}
      placeholderTextColor="$neutral3"
      px={centered ? '$spacing60' : '$spacing24'}
      py={large ? '$spacing20' : '$spacing16'}
      secureTextEntry={hideInput}
      textAlign={centered ? 'center' : 'left'}
      width="100%"
      {...rest}
    />
  )
})
