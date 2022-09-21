import { forwardRef } from 'react'
import { FormEvent } from 'react'

import { Atoms } from '../../css/atoms'
import { isNumber } from '../../utils/numbers'
import { Box, BoxProps } from '../Box'

export const defaultInputStyle: Atoms = {
  borderColor: { default: 'medGray', focus: 'darkGray' },
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: '8',
  padding: '12',
  fontSize: '14',
  color: { placeholder: 'darkGray', default: 'blackBlue' },
  backgroundColor: 'transparent',
}

export const Input = forwardRef<HTMLInputElement, BoxProps>((props, ref) => (
  <Box
    ref={ref}
    as="input"
    borderColor={{ default: 'medGray', focus: 'darkGray' }}
    borderWidth="1px"
    borderStyle="solid"
    borderRadius="12"
    padding="12"
    fontSize="14"
    color={{ placeholder: 'darkGray', default: 'blackBlue' }}
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
      autoComplete="off"
      type="text"
      onInput={(v: FormEvent<HTMLInputElement>) => {
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
