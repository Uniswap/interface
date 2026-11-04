import { Input as CompatInput, InputProps as CompatInputProps, fonts, inputStyles } from '@universe/mycelium'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

export type InputProps = {
  large?: boolean
  hideInput?: boolean
  centered?: boolean
} & CompatInputProps

export type Input = CompatInput

export const Input: ForwardRefExoticComponent<InputProps & RefAttributes<Input>> = forwardRef<Input, InputProps>(
  function InputInner({ large = false, hideInput = false, centered = false, ...rest }: InputProps, ref): JSX.Element {
    return (
      <CompatInput
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
  },
)
