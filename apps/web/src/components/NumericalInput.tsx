import { loadingOpacityMixin } from 'components/Loader/styled'
import { deprecatedStyled } from 'lib/styled-components'
import React, { forwardRef } from 'react'
import { Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { escapeRegExp } from 'utils/escapeRegExp'

export const StyledInput = deprecatedStyled.input<{
  error?: boolean
  fontSize?: string
  align?: string
  disabled?: boolean
}>`
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

export function localeUsesComma(locale: Locale): boolean {
  const decimalSeparator = new Intl.NumberFormat(locale).format(1.1)[1]

  return decimalSeparator === ','
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export interface InputProps extends Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'> {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  prependSymbol?: string
  maxDecimals?: number
  testId?: string
}

export function isInputGreaterThanDecimals(value: string, maxDecimals?: number): boolean {
  const decimalGroups = value.split('.')
  return !!maxDecimals && decimalGroups.length > 1 && decimalGroups[1].length > maxDecimals
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onUserInput, placeholder, prependSymbol, maxDecimals, testId, ...rest }: InputProps, ref) => {
    const locale = useCurrentLocale()

    const enforcer = (nextUserInput: string) => {
      if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
        if (isInputGreaterThanDecimals(nextUserInput, maxDecimals)) {
          return
        }

        onUserInput(nextUserInput)
      }
    }

    const formatValueWithLocale = (value: string | number) => {
      const [searchValue, replaceValue] = localeUsesComma(locale) ? [/\./g, ','] : [/,/g, '.']
      return value.toString().replace(searchValue, replaceValue)
    }

    const valueFormattedWithLocale = formatValueWithLocale(value)

    return (
      <StyledInput
        {...rest}
        ref={ref}
        value={prependSymbol && value ? prependSymbol + valueFormattedWithLocale : valueFormattedWithLocale}
        data-testid={testId}
        onChange={(event) => {
          if (prependSymbol) {
            const value = event.target.value

            // cut off prepended symbol
            const formattedValue = value.toString().includes(prependSymbol)
              ? value.toString().slice(prependSymbol.length, value.toString().length + 1)
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
  },
)

Input.displayName = 'Input'

const MemoizedInput = React.memo(Input)
export { MemoizedInput as Input }
// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const StyledNumericalInput = deprecatedStyled(MemoizedInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  text-align: left;
  font-size: 36px;
  font-weight: 485;
  max-height: 44px;
`
