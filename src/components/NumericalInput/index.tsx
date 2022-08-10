import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import React from 'react'
import styled from 'styled-components/macro'

import { escapeRegExp } from '../../utils'

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string; phase0Flag: boolean }>`
  color: ${({ error, theme }) => (error ? theme.deprecated_red1 : theme.deprecated_text1)};
  width: 0;
  position: relative;
  font-weight: ${({ phase0Flag }) => (phase0Flag ? 400 : 500)};
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: ${({ theme, phase0Flag }) => (phase0Flag ? theme.none : theme.deprecated_bg1)};
  font-size: ${({ fontSize }) => fontSize ?? '28px'};
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  -webkit-appearance: textfield;
  text-align: right;

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme, phase0Flag }) => (phase0Flag ? theme.textSecondary : theme.deprecated_text4)};
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const Input = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  prependSymbol,
  ...rest
}: {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  prependSymbol?: string | undefined
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const phase0Flag = usePhase0Flag()
  const phase0FlagEnabled = phase0Flag === Phase0Variant.Enabled
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }

  return (
    <StyledInput
      {...rest}
      value={prependSymbol && value ? prependSymbol + value : value}
      phase0Flag={phase0FlagEnabled}
      onChange={(event) => {
        if (prependSymbol) {
          const value = event.target.value

          // cut off prepended symbol
          const formattedValue = value.toString().includes(prependSymbol)
            ? value.toString().slice(1, value.toString().length + 1)
            : value

          // replace commas with periods, because uniswap exclusively uses period as the decimal separator
          enforcer(formattedValue.replace(/,/g, '.'))
        } else {
          enforcer(event.target.value.replace(/,/g, '.'))
        }
      }}
      // universal input options
      inputMode="decimal"
      autoComplete="off"
      autoCorrect="off"
      // text-specific options
      type="text"
      pattern="^[0-9]*[.,]?[0-9]*$"
      placeholder={placeholder || (phase0FlagEnabled ? '0' : '0.0')}
      minLength={1}
      maxLength={79}
      spellCheck="false"
    />
  )
})

export default Input

// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
