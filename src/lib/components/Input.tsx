import styled, { css } from 'lib/theme'
import { ChangeEvent, forwardRef, HTMLProps, useCallback } from 'react'

const Input = styled.input`
  -webkit-appearance: textfield;
  background-color: transparent;
  border: none;
  color: currentColor;
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  margin: 0;
  outline: none;
  overflow: hidden;
  padding: 0;
  text-align: left;
  text-overflow: ellipsis;
  width: 100%;

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
    color: ${({ theme }) => theme.secondary};
  }
`

export default Input

interface StringInputProps extends Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'as' | 'value'> {
  value: string
  onChange: (input: string) => void
}

export const StringInput = forwardRef<HTMLInputElement, StringInputProps>(function StringInput(
  { value, onChange, ...props }: StringInputProps,
  ref
) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      // universal input options
      inputMode="text"
      autoComplete="off"
      autoCorrect="off"
      // text-specific options
      type="text"
      placeholder={props.placeholder || '-'}
      minLength={1}
      spellCheck="false"
      ref={ref as any}
      {...props}
    />
  )
})

interface NumericInputProps extends Omit<HTMLProps<HTMLInputElement>, 'onChange' | 'as' | 'value'> {
  value: string
  onChange: (input: string) => void
}

interface EnforcedNumericInputProps extends NumericInputProps {
  // Validates nextUserInput; returns stringified value, or null if invalid
  enforcer: (nextUserInput: string) => string | null
}

const NumericInput = forwardRef<HTMLInputElement, EnforcedNumericInputProps>(function NumericInput(
  { value, onChange, enforcer, pattern, ...props }: EnforcedNumericInputProps,
  ref
) {
  const validateChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextInput = enforcer(event.target.value.replace(/,/g, '.'))?.replace(/^0+$/, '0')
      if (nextInput !== undefined) {
        onChange(nextInput)
      }
    },
    [enforcer, onChange]
  )

  return (
    <Input
      value={value}
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
      maxLength={79}
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
    return isNaN(nextInput) ? '' : nextInput.toString()
  }
  return null
}
export const IntegerInput = forwardRef(function IntegerInput(props: NumericInputProps, ref) {
  return <NumericInput pattern="^[0-9]*$" enforcer={integerEnforcer} ref={ref as any} {...props} />
})

const decimalRegexp = /^\d*(?:[.])?\d*$/
const decimalEnforcer = (nextUserInput: string) => {
  if (nextUserInput === '') {
    return ''
  } else if (nextUserInput === '.') {
    return '0.'
  } else if (decimalRegexp.test(nextUserInput)) {
    return nextUserInput
  }
  return null
}
export const DecimalInput = forwardRef(function DecimalInput(props: NumericInputProps, ref) {
  return <NumericInput pattern="^[0-9]*[.,]?[0-9]*$" enforcer={decimalEnforcer} ref={ref as any} {...props} />
})

export const inputCss = css`
  background-color: ${({ theme }) => theme.container};
  border: 1px solid ${({ theme }) => theme.container};
  border-radius: ${({ theme }) => theme.borderRadius}em;
  cursor: text;
  padding: calc(0.5em - 1px);

  :hover:not(:focus-within) {
    background-color: ${({ theme }) => theme.onHover(theme.container)};
    border-color: ${({ theme }) => theme.onHover(theme.container)};
  }

  :focus-within {
    border-color: ${({ theme }) => theme.active};
  }
`
