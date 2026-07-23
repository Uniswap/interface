import React, { forwardRef } from 'react'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { InputProps, localeUsesComma, StyledInput } from '~/components/NumericalInput/NumericalInput'

type PercentInputRef = React.ElementRef<typeof StyledInput>

/** Percent fields do not use currency prepend or swap-specific layout variants. */
type PercentInputProps = Omit<InputProps, 'prependSymbol' | 'amountLayout'>

const PercentInput = forwardRef<PercentInputRef, PercentInputProps>(
  ({ value, onUserInput, placeholder, testId, maxDecimals = 2, ...rest }: PercentInputProps, ref) => {
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

    // oxlint-disable-next-line no-shadow
    const formatValueWithLocale = (value: string | number) => {
      const [searchValue, replaceValue] = localeUsesComma(locale) ? [/\./g, ','] : [/,/g, '.']
      return value.toString().replace(searchValue, replaceValue)
    }

    const valueFormattedWithLocale = formatValueWithLocale(value)

    return (
      <StyledInput
        {...rest}
        ref={ref}
        maxLength={maxDecimals + 2}
        value={valueFormattedWithLocale}
        testID={testId}
        onChangeText={enforcer}
        keyboardType="numeric"
        autoComplete="off"
        autoCorrect={false}
        placeholder={placeholder || '0'}
        spellCheck={false}
      />
    )
  },
)

PercentInput.displayName = 'Input'

const MemoizedInput = React.memo(PercentInput)

export type StyledPercentInputProps = PercentInputProps & {
  fieldWidth?: number
  numericalFontSize?: number
}

export const StyledPercentInput = forwardRef<PercentInputRef, StyledPercentInputProps>(
  ({ fieldWidth, numericalFontSize, ...props }, ref) => (
    <MemoizedInput
      ref={ref}
      {...props}
      width={fieldWidth ?? 43}
      fontSize={numericalFontSize ?? 70}
      maxHeight={84}
      maxWidth="100%"
      fontWeight="$book"
      lineHeight={60}
      textAlign="left"
    />
  ),
)
StyledPercentInput.displayName = 'StyledPercentInput'
