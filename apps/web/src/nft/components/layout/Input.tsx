import { forwardRef } from 'react'
import { InputProps, Input as TamaguiInput } from 'ui/src'

const isNumber = (s: string): boolean => {
  const reg = /^-?\d+\.?\d*$/
  return reg.test(s) && !isNaN(parseFloat(s)) && isFinite(parseFloat(s))
}

export const Input = (props: InputProps) => (
  <TamaguiInput
    borderColor="$surface3"
    borderWidth={1}
    borderStyle="solid"
    backgroundColor="$transparent"
    borderRadius="$rounded16"
    px="$padding12"
    py="$padding20"
    fontSize="14"
    fontWeight="book"
    focusStyle={{ borderColor: '$neutral3' }}
    hoverStyle={{ borderColor: '$neutral3' }}
    {...props}
  />
)

Input.displayName = 'Input'

export const NumericInput = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return (
    <TamaguiInput
      ref={ref as any}
      inputMode="decimal"
      autoComplete="off"
      borderColor="$surface3"
      focusStyle={{ borderColor: '$neutral2' }}
      color="$neutral1"
      borderWidth={0}
      height="100%"
      onChangeText={(value) => {
        if (value === '.') {
          value = '0.'
        }

        const isValid = value === '' || (isNumber(value) && parseFloat(value) >= 0)
        const finalValue = isValid ? value : ''

        props.onChangeText?.(finalValue)
      }}
      {...props}
    />
  )
})

NumericInput.displayName = 'NumericInput'
