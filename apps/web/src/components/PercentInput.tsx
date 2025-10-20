import { InputProps, localeUsesComma, StyledInput } from 'components/NumericalInput'
import { NumericalInputFontStyle } from 'pages/Swap/common/shared'
import React, { forwardRef } from 'react'
// biome-ignore lint/style/noRestrictedImports: styled-components needed for input component styling
import styled from 'styled-components'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'

const PercentInput = forwardRef<HTMLInputElement, InputProps>(
  ({ value, onUserInput, placeholder, testId, maxDecimals = 2, ...rest }: InputProps, ref) => {
    const inputRegexStr = `^\\d*(\\.\\d{0,${maxDecimals}})?$`
    const noDecimalRegexStr = '^\\d*$'
    const inputRegex = RegExp(inputRegexStr)
    const noDecimalRegex = RegExp(noDecimalRegexStr)
    const locale = useCurrentLocale()

    const enforcer = (nextUserInput: string) => {
      const sanitizedInput = nextUserInput.replace(/,/g, '.') // Normalize the input
      if (sanitizedInput === '' || (maxDecimals <= 0 ? noDecimalRegex : inputRegex).test(sanitizedInput)) {
        onUserInput(sanitizedInput)
      }
    }

    const formatValueWithLocale = (value: string | number) => {
      const [searchValue, replaceValue] = localeUsesComma(locale) ? [/\./g, ','] : [/,/g, '.']
      return value.toString().replace(searchValue, replaceValue)
    }

    const valueFormattedWithLocale = formatValueWithLocale(value)

    return (
      <StyledInput
        minLength={1}
        maxLength={maxDecimals + 2}
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
        pattern={maxDecimals <= 0 ? noDecimalRegexStr : inputRegexStr}
        placeholder={placeholder || '0'}
        spellCheck="false"
      />
    )
  },
)

PercentInput.displayName = 'Input'

const MemoizedInput = React.memo(PercentInput)

export const StyledPercentInput = styled(MemoizedInput)<{ $width?: number; $fontSize?: number }>`
  max-height: 84px;
  max-width: 100%;
  width: ${({ $width }) => `${$width ?? 43}px`}; // this value is from the size of a 0 which is the default value
  ${NumericalInputFontStyle}

  ::placeholder {
    opacity: 1;
  }
`
