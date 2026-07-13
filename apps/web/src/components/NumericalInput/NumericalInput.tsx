import React, { forwardRef } from 'react'
import { Input, styled, type GetProps } from 'ui/src'
import { Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { escapeRegExp } from '~/utils/escapeRegExp'

export const StyledInput = styled(Input, {
  unstyled: true,
  name: 'NumericalStyledInput',
  width: 0,
  minWidth: 0,
  position: 'relative',
  fontFamily: '$body',
  fontWeight: '$book',
  outlineWidth: 0,
  borderWidth: 0,
  flexGrow: 1,
  flexShrink: 1,
  flexBasis: 'auto',
  backgroundColor: 'transparent',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  padding: 0,
  color: '$neutral1',
  placeholderTextColor: '$neutral2',

  focusStyle: {
    outlineWidth: 0,
    outlineStyle: 'none',
    borderWidth: 0,
    boxShadow: 'none',
  },

  focusVisibleStyle: {
    outlineWidth: 0,
    outlineStyle: 'none',
    borderWidth: 0,
    boxShadow: 'none',
  },

  '$platform-web': {
    outlineStyle: 'none',
    outlineWidth: 0,
  },

  variants: {
    amountLayout: {
      default: {
        fontSize: 28,
        textAlign: 'right',
      },
      swapCurrency: {
        fontSize: 36,
        textAlign: 'left',
        maxHeight: 44,
      },
    },
  } as const,

  defaultVariants: {
    amountLayout: 'default',
  },
})

export function localeUsesComma(locale: Locale): boolean {
  const decimalSeparator = new Intl.NumberFormat(locale).format(1.1)[1]

  return decimalSeparator === ','
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

/** Tamagui `Input` props accepted by `StyledInput`, excluding fields owned by numerical-input logic. */
export type NumericalInputTamaguiPassthrough = Omit<
  GetProps<typeof StyledInput>,
  'value' | 'onChangeText' | 'onChange' | 'defaultValue'
>

export type NumericalInputOwnProps = {
  value: string | number
  onUserInput: (input: string) => void
  prependSymbol?: string
  maxDecimals?: number
  testId?: string
  /** Larger left-aligned type used by swap / limit amount fields */
  amountLayout?: 'default' | 'swapCurrency'
}

export type InputProps = NumericalInputTamaguiPassthrough & NumericalInputOwnProps

export function isInputGreaterThanDecimals(value: string, maxDecimals?: number): boolean {
  const decimalGroups = value.split('.')
  return !!maxDecimals && decimalGroups.length > 1 && decimalGroups[1].length > maxDecimals
}

type NumericalInputRef = React.ElementRef<typeof StyledInput>

const InputInner = forwardRef<NumericalInputRef, InputProps>(
  (
    {
      value,
      onUserInput,
      placeholder,
      prependSymbol,
      maxDecimals,
      testId,
      amountLayout = 'default',
      disabled,
      maxLength = 79,
      // Pulled out so we can apply after `amountLayout` variant (Send / shared) without relying on spread order.
      fontSize: fontSizeProp,
      lineHeight: lineHeightProp,
      width: widthProp,
      maxWidth: maxWidthProp,
      maxHeight: maxHeightProp,
      ...rest
    }: InputProps,
    ref,
  ) => {
    const locale = useCurrentLocale()

    const enforcer = (nextUserInput: string) => {
      if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
        if (isInputGreaterThanDecimals(nextUserInput, maxDecimals)) {
          return
        }

        onUserInput(nextUserInput)
      }
    }

    const handleChangeText = (raw: string) => {
      const normalized = raw.replace(/,/g, '.')
      if (prependSymbol) {
        const formattedValue = normalized.includes(prependSymbol)
          ? normalized.slice(prependSymbol.length, normalized.length + 1)
          : normalized
        enforcer(formattedValue)
      } else {
        enforcer(normalized)
      }
    }

    // oxlint-disable-next-line no-shadow
    const formatValueWithLocale = (value: string | number) => {
      const [searchValue, replaceValue] = localeUsesComma(locale) ? [/\./g, ','] : [/,/g, '.']
      return value.toString().replace(searchValue, replaceValue)
    }

    const valueFormattedWithLocale = formatValueWithLocale(value)
    const displayValue = prependSymbol && value ? prependSymbol + valueFormattedWithLocale : valueFormattedWithLocale

    return (
      <StyledInput
        ref={ref}
        amountLayout={amountLayout}
        pointerEvents={disabled ? 'none' : 'auto'}
        editable={!disabled}
        disabled={disabled}
        value={displayValue}
        testID={testId}
        onChangeText={handleChangeText}
        keyboardType="decimal-pad"
        autoComplete="off"
        autoCorrect={false}
        placeholder={placeholder || '0'}
        maxLength={maxLength}
        spellCheck={false}
        {...rest}
        {...(fontSizeProp !== undefined ? { fontSize: fontSizeProp } : {})}
        {...(lineHeightProp !== undefined ? { lineHeight: lineHeightProp } : {})}
        {...(widthProp !== undefined ? { width: widthProp } : {})}
        {...(maxWidthProp !== undefined ? { maxWidth: maxWidthProp } : {})}
        {...(maxHeightProp !== undefined ? { maxHeight: maxHeightProp } : {})}
      />
    )
  },
)

InputInner.displayName = 'Input'

const MemoizedInput = React.memo(InputInner)
export { MemoizedInput as Input }

/** Swap/limit amount field (`amountLayout="swapCurrency"`). Buy/Send/Earn use `StyledNumericalInput` in `~/components/NumericalInput/LargeAmountInput`, which sets typography via explicit props instead of this variant. */
export const SwapCurrencyInput = forwardRef<NumericalInputRef, InputProps>((props, ref) => (
  <MemoizedInput {...props} ref={ref} amountLayout="swapCurrency" />
))
SwapCurrencyInput.displayName = 'SwapCurrencyInput'
