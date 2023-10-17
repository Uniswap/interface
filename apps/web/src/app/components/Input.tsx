import { forwardRef } from 'react'
import { GetRef, Input as TamaguiInput, InputProps as TamaguiInputProps } from 'ui/src'
import { inputStyles } from 'ui/src/components/input/utils'
import { fonts } from 'ui/src/theme/fonts'

type InputProps = {
  large?: boolean
  hideInput?: boolean
  centered?: boolean
} & TamaguiInputProps

export const Input = forwardRef<GetRef<typeof TamaguiInput>, InputProps>(function _Input(
  { large = false, hideInput = false, centered = false, ...rest }: InputProps,
  ref
): JSX.Element {
  return (
    <TamaguiInput
      ref={ref}
      backgroundColor={large ? '$surface1' : '$surface2'}
      borderColor="$surface3"
      borderRadius={large ? '$rounded12' : '$rounded20'}
      borderWidth={1}
      focusStyle={inputStyles.inputFocus}
      fontSize={fonts.subheading1.fontSize}
      height="auto"
      hoverStyle={inputStyles.inputHover}
      paddingHorizontal={centered ? '$spacing60' : '$spacing24'}
      paddingVertical={large ? '$spacing24' : '$spacing16'}
      placeholderTextColor="$neutral3"
      secureTextEntry={hideInput}
      textAlign={centered ? 'center' : 'left'}
      width="100%"
      {...rest}
    />
  )
})
