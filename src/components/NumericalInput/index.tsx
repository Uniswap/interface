import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { escapeRegExp } from 'utils'

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string; disabled?: boolean }>`
  color: ${({ error, theme }) => (error ? theme.critical : theme.neutral1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  width: 0;
  position: relative;
  font-weight: 485;
  outline: none;
  border: none;
  flex: 1 1 auto;
  background-color: transparent;
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
    color: ${({ theme }) => theme.neutral3};
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

interface InputProps extends Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'> {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  prependSymbol?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onUserInput, placeholder, prependSymbol, ...rest }: InputProps, ref) => {
    const enforcer = (nextUserInput: string) => {
      if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
        onUserInput(nextUserInput)
      }
    }

    return (
      <StyledInput
        {...rest}
        ref={ref}
        value={prependSymbol && value ? prependSymbol + value : value}
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
        placeholder={placeholder || '0'}
        minLength={1}
        maxLength={79}
        spellCheck="false"
      />
    )
  }
)

Input.displayName = 'Input'

const MemoizedInput = React.memo(Input)
export { MemoizedInput as Input }
// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
