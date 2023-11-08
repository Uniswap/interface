import { FormEvent, forwardRef } from 'react'

import { Box, BoxProps } from '../Box'

const isNumber = (s: string): boolean => {
  const reg = /^-?\d+\.?\d*$/
  return reg.test(s) && !isNaN(parseFloat(s)) && isFinite(parseFloat(s))
}

export const Input = forwardRef<HTMLInputElement, BoxProps>((props, ref) => (
  <Box
    ref={ref}
    as="input"
    borderColor={{ default: 'surface3', focus: 'neutral3' }}
    borderWidth="1px"
    borderStyle="solid"
    borderRadius="12"
    padding="12"
    fontSize="14"
    fontWeight="book"
    color={{ placeholder: 'neutral2', default: 'neutral1' }}
    backgroundColor="transparent"
    {...props}
  />
))

Input.displayName = 'Input'

export const NumericInput = forwardRef<HTMLInputElement, BoxProps>((props, ref) => {
  return (
    <Box
      ref={ref}
      as="input"
      inputMode="decimal"
      autoComplete="off"
      type="text"
      borderColor={{ default: 'surface3', focus: 'neutral2' }}
      color={{ placeholder: 'neutral2', default: 'neutral1' }}
      onInput={(v: FormEvent<HTMLInputElement>) => {
        if (v.currentTarget.value === '.') {
          v.currentTarget.value = '0.'
        }

        v.currentTarget.value =
          !!v.currentTarget.value && isNumber(v.currentTarget.value) && parseFloat(v.currentTarget.value) >= 0
            ? v.currentTarget.value
            : ''
      }}
      {...props}
    />
  )
})

NumericInput.displayName = 'Input'
