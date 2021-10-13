import styled from 'lib/styled'
import { forwardRef, HTMLProps, useEffect, useState } from 'react'

const StyledInput = styled.input`
  background-color: transparent;
  border: none;
  color: currentColor;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  outline: none;
  overflow: hidden;
  padding: 0px;
  text-align: left;
  text-overflow: ellipsis;

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

  ::placeholder {
    color: currentColor;
  }
`

interface InputProps extends Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'as' | 'value' | 'onUserInput'> {
  value: number | undefined
  onUserInput: (input: number | undefined) => void
}

export const InputFactory = (enforcer: (nextUserInput: string) => string | undefined | null, pattern: string) =>
  forwardRef<HTMLInputElement, InputProps>(function Input({ value, onUserInput, ...props }: InputProps, ref) {
    // Allow value/onUserInput to use number by preventing a  trailing decimal separator from triggering onUserInput
    const [state, setState] = useState(value ?? '')
    useEffect(() => {
      if (+state !== value) {
        setState(value ?? '')
      }
    }, [value, state, setState])

    return (
      <StyledInput
        value={state}
        onChange={(event) => {
          const nextInput = enforcer(event.target.value.replace(/,/g, '.'))
          if (nextInput !== null) {
            setState(nextInput ?? '')
            if (nextInput === undefined || +nextInput !== value) {
              onUserInput(nextInput === undefined ? undefined : +nextInput)
            }
          }
        }}
        // universal input options
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        type="text"
        pattern={pattern}
        placeholder={props.placeholder || '0'}
        minLength={1}
        spellCheck="false"
        ref={ref as any}
        {...props}
      />
    )
  })

export const IntegerInput = InputFactory(
  (() => {
    const regexp = /^\d*$/
    return (nextUserInput: string) => {
      if (nextUserInput === '' || regexp.test(nextUserInput)) {
        const nextInput = parseInt(nextUserInput)
        return isNaN(nextInput) ? undefined : nextInput.toString()
      }
      return null
    }
  })(),
  '^[0-9]*$'
)
export const DecimalInput = InputFactory(
  (() => {
    const regexp = /^\d*(?:[\.])?\d*$/
    return (nextUserInput: string) => {
      if (nextUserInput === '') {
        return undefined
      } else if (regexp.test(nextUserInput)) {
        return nextUserInput
      }
      return null
    }
  })(),
  '^[0-9]*[.,]?[0-9]*$'
)
