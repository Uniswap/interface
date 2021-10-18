import styled from 'lib/theme'
import { forwardRef, HTMLProps, useCallback, useEffect, useState } from 'react'

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

interface InputProps extends Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'as' | 'value'> {
  value: number | undefined
  onChange: (input: number | undefined) => void
}

interface EnforcedInputProps extends InputProps {
  // Validates nextUserInput; returns stringified value or undefined if valid, or null if invalid
  enforcer: (nextUserInput: string) => string | undefined | null
}

const Input = forwardRef<HTMLInputElement, EnforcedInputProps>(function Input(
  { value, onChange, enforcer, pattern, ...props }: EnforcedInputProps,
  ref
) {
  // Allow value/onChange to use number by preventing a  trailing decimal separator from triggering onChange
  const [state, setState] = useState(value ?? '')
  useEffect(() => {
    if (+state !== value) {
      setState(value ?? '')
    }
  }, [value, state, setState])

  const validateChange = useCallback(
    (event) => {
      const nextInput = enforcer(event.target.value.replace(/,/g, '.'))
      if (nextInput !== null) {
        setState(nextInput ?? '')
        if (nextInput === undefined || +nextInput !== value) {
          onChange(nextInput === undefined ? undefined : +nextInput)
        }
      }
    },
    [value, onChange, enforcer]
  )

  return (
    <StyledInput
      value={state}
      onChange={validateChange}
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

const integerRegexp = /^\d*$/
const integerEnforcer = (nextUserInput: string) => {
  if (nextUserInput === '' || integerRegexp.test(nextUserInput)) {
    const nextInput = parseInt(nextUserInput)
    return isNaN(nextInput) ? undefined : nextInput.toString()
  }
  return null
}
export const IntegerInput = forwardRef(function IntegerInput(props: InputProps, ref) {
  return <Input pattern="^[0-9]*$" enforcer={integerEnforcer} ref={ref as any} {...props} />
})

const decimalRegexp = /^\d*(?:[\.])?\d*$/
const decimalEnforcer = (nextUserInput: string) => {
  if (nextUserInput === '') {
    return undefined
  } else if (decimalRegexp.test(nextUserInput)) {
    return nextUserInput
  }
  return null
}
export const DecimalInput = forwardRef(function DecimalInput(props: InputProps, ref) {
  return <Input pattern="^[0-9]*[.,]?[0-9]*$" enforcer={decimalEnforcer} ref={ref as any} {...props} />
})
