import { loadingOpacityMixin } from 'components/Loader/styled'
import { SupportedLocale } from 'constants/locales'
import React, { forwardRef } from 'react'
import styled from 'styled-components'
import { escapeRegExp } from 'utils'
import { useFormatterLocales } from 'utils/formatNumbers'

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

function localeUsesComma(locale: SupportedLocale): boolean {
  const decimalSeparator = new Intl.NumberFormat(locale).format(1.1)[1]

  return decimalSeparator === ','
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

interface InputProps extends Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'> {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  prependSymbol?: string
  maxDecimals?: number
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onUserInput, placeholder, prependSymbol, maxDecimals, ...rest }: InputProps, ref) => {
    const { formatterLocale } = useFormatterLocales()

    const enforcer = (nextUserInput: string) => {
      if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
        const decimalGroups = nextUserInput.split('.')
        if (maxDecimals && decimalGroups.length > 1 && decimalGroups[1].length > maxDecimals) {
          return
        }

        onUserInput(nextUserInput)
      }
    }

    const formatValueWithLocale = (value: string | number) => {
      const [searchValue, replaceValue] = localeUsesComma(formatterLocale) ? [/\./g, ','] : [/,/g, '.']
      return value.toString().replace(searchValue, replaceValue)
    }

    const valueFormattedWithLocale = formatValueWithLocale(value)

    return (
      <StyledInput
        {...rest}
        ref={ref}
        value={prependSymbol && value ? prependSymbol + valueFormattedWithLocale : valueFormattedWithLocale}
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
  }
)

Input.displayName = 'Input'

const MemoizedInput = React.memo(Input)
export { MemoizedInput as Input }
// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const StyledNumericalInput = styled(MemoizedInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  text-align: left;
  font-size: 36px;
  font-weight: 485;
  max-height: 44px;
`
