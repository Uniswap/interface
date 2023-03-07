import { isNumber } from 'nft/utils/numbers'
import { FormEvent, forwardRef } from 'react'

import { Box, BoxProps } from '../Box'

export const Input = forwardRef<HTMLInputElement, BoxProps>((props, ref) => (
  <Box
    ref={ref}
    as="input"
    borderColor={{ default: 'backgroundOutline', focus: 'textSecondary' }}
    borderWidth="1px"
    borderStyle="solid"
    borderRadius="12"
    padding="12"
    fontSize="14"
    color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
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
      borderColor={{ default: 'backgroundOutline', focus: 'textSecondary' }}
      color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
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
