import inputClear from 'assets/svg/inputclear.svg'
import React from 'react'
import styled from 'styled-components'

import { escapeRegExp } from '../../utils'

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string }>`
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  width: 0;
  font-family: 'Poppins';
  position: relative;
  user-select: none;
  font-weight: 500;
  outline: none;
  border: none;
  flex: 1 1 auto;
  caret-color: #39e1ba;
  height: 2rem;
  background-color: ${({ theme }) => theme.colorTransparent};
  font-size: ${({ fontSize }) => fontSize ?? '2rem'};
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px;
  padding-right: 30px;
  -webkit-appearance: textfield;

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

  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
    width: 22px;
    height: 22px;
    position: relative;
    background-image: url(${inputClear});
    right: -11px;
    // background-color: red;
  }

  ::placeholder {
    color: ${({ theme }) => theme.text4};
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const Input = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  ...rest
}: {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }
  return (
    <StyledInput
      {...rest}
      value={`${value}`
        .replace(/,/g, '')
        .split('.')
        .map((e, index) => {
          if (index === 0) {
            console.log(e)
            return e.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          } else {
            return e
          }
        })
        .join('.')}
      onChange={(event) => {
        // replace commas with periods, because uniswap exclusively uses period as the decimal separator
        enforcer(event.target.value.replace(/,/g, '.'))
      }}
      // universal input options
      inputMode="decimal"
      title="Token Amount"
      autoComplete="off"
      autoCorrect="off"
      // text-specific options
      type="search"
      pattern="^[0-9]*[.,]?[0-9]*$"
      placeholder={placeholder || '0.0'}
      minLength={1}
      maxLength={79}
      spellCheck="false"
    />
  )
})

export default Input

// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
