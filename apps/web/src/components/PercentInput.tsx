import { InputProps, StyledInput, localeUsesComma } from 'components/NumericalInput'
import { NumericalInputFontStyle } from 'pages/Swap/common/shared'
import React, { forwardRef } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import styled from 'styled-components'
import { useFormatterLocales } from 'utils/formatNumbers'

const inputRegex = RegExp(`^\\d*(\\.\\d{0,2})?$`)

const PercentInput = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onUserInput, placeholder, testId, ...rest }: InputProps, ref) => {
    const { formatterLocale } = useFormatterLocales()

    const enforcer = (nextUserInput: string) => {
      const sanitizedInput = nextUserInput.replace(/,/g, '.') // Normalize the input
      if (sanitizedInput === '' || inputRegex.test(sanitizedInput)) {
        onUserInput(sanitizedInput)
      }
    }

    const formatValueWithLocale = (value: string | number) => {
      const [searchValue, replaceValue] = localeUsesComma(formatterLocale) ? [/\./g, ','] : [/,/g, '.']
      return value.toString().replace(searchValue, replaceValue)
    }

    const valueFormattedWithLocale = formatValueWithLocale(value)

    return (
      <StyledInput
        minLength={1}
        maxLength={2}
        {...rest}
        ref={ref}
        value={valueFormattedWithLocale}
        data-testid={testId}
        onChange={(event) => {
          enforcer(event.target.value)
        }}
        // universal input options
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        type="text"
        pattern="^\\d*(\\.\\d{0,2})?$"
        placeholder={placeholder || '0'}
        spellCheck="false"
      />
    )
  },
)

PercentInput.displayName = 'Input'

const MemoizedInput = React.memo(PercentInput)

export const StyledPercentInput = styled(MemoizedInput)<{ $width?: number }>`
  max-height: 84px;
  max-width: 100%;
  width: ${({ $width }) => `${$width ?? 43}px`}; // this value is from the size of a 0 which is the default value
  ${NumericalInputFontStyle}

  ::placeholder {
    opacity: 1;
  }
`
