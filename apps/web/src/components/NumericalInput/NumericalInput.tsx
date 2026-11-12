import { defaultWeights, Input as BaseInput, type InputProps as BaseInputProps } from '@universe/mycelium'
import React, { type ElementRef, forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import { Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { escapeRegExp } from 'utilities/src/primitives/string'

/** Larger left-aligned type used by swap / limit amount fields. */
export type AmountLayout = 'default' | 'swapCurrency'

export type StyledInputProps = BaseInputProps & {
  amountLayout?: AmountLayout
}

// Spread before `{...rest}` so a call site still beats the layout.
const AMOUNT_LAYOUT_PROPS = {
  default: { fontSize: 28, textAlign: 'right' },
  swapCurrency: { fontSize: 36, textAlign: 'left', maxHeight: 44 },
} as const satisfies Record<AmountLayout, BaseInputProps>

// Explicit return type: see "TS2883 on exported forwardRef wrappers" in packages/mycelium/CLAUDE.md.
export const StyledInput: ForwardRefExoticComponent<StyledInputProps & RefAttributes<ElementRef<typeof BaseInput>>> =
  forwardRef<ElementRef<typeof BaseInput>, StyledInputProps>(function StyledInput(
    { amountLayout = 'default', '$platform-web': platformWeb, ...rest },
    ref,
  ) {
    return (
      <BaseInput
        ref={ref}
        unstyled
        width={0}
        minWidth={0}
        position="relative"
        fontFamily="$body"
        // Literal weight: the Input's own token resolution is the only font layer here.
        fontWeight={defaultWeights.book}
        outlineWidth={0}
        borderWidth={0}
        flexGrow={1}
        flexShrink={1}
        flexBasis="auto"
        backgroundColor="transparent"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
        padding={0}
        color="$neutral1"
        placeholderTextColor="$neutral2"
        // No focusStyle/focusVisibleStyle: their values already hold at rest, and the Input spreads
        // focusStyle after the RN `style` prop, so passing them would let focus beat inline `style`.
        $platform-web={{ outlineStyle: 'none', outlineWidth: 0, ...platformWeb }}
        {...AMOUNT_LAYOUT_PROPS[amountLayout]}
        {...rest}
      />
    )
  })

export function localeUsesComma(locale: Locale): boolean {
  const decimalSeparator = new Intl.NumberFormat(locale).format(1.1)[1]

  return decimalSeparator === ','
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

/** Compat Input props accepted by `StyledInput`, excluding fields owned by numerical-input logic. */
export type NumericalInputPassthrough = Omit<
  StyledInputProps,
  'value' | 'onChangeText' | 'onChange' | 'defaultValue' | 'amountLayout'
>

export type NumericalInputOwnProps = {
  value: string | number
  onUserInput: (input: string) => void
  prependSymbol?: string
  maxDecimals?: number
  testId?: string
  /** Larger left-aligned type used by swap / limit amount fields */
  amountLayout?: AmountLayout
}

export type InputProps = NumericalInputPassthrough & NumericalInputOwnProps

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
