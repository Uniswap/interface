import React from 'react'
import styled from 'styled-components'

const StyledInput = styled.input`
  color: ${({ error, theme }) => error && theme.salmonRed};
  background-color: ${({ theme }) => theme.inputBackground};
  color: ${({ theme }) => theme.textColor};
  font-size: 20px;
  outline: none;
  border: none;
  flex: 1 1 auto;
  width: 0;
  background-color: ${({ theme }) => theme.inputBackground};

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: ${({ theme }) => theme.chaliceGray};
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\.)?\\d*$`) // match escaped "." characters via in a non-capturing group

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export const Input = React.memo(({ field, value, onUserInput, ...rest }: any) => {
  function enforcer(nextUserInput: string) {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(field, nextUserInput)
    }
  }

  return (
    <StyledInput
      {...rest}
      value={value}
      onChange={event => {
        enforcer(event.target.value)
      }}
      // universal input options
      inputMode="decimal"
      title="Token Amount"
      autoComplete="off"
      autoCorrect="off"
      // text-specific options
      type="text"
      placeholder="0.0"
      minLength={1}
      maxLength={79}
      spellCheck="false"
    />
  )
})

export default Input
