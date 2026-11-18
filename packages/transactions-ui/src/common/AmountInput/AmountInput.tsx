import {
  AnimatedFlex,
  type AnimatedFlexProps,
  Flex,
  fonts,
  Input,
  type InputProps,
  Text,
  TouchableArea,
} from '@universe/mycelium'
import {
  AMOUNT_LINE_HEIGHT_RATIO,
  type AmountFontSizeRange,
  DEFAULT_AMOUNT_FONT_SIZE_RANGE,
  getAmountFontSize,
} from '@universe/transactions-ui/src/common/AmountInput/amountFontSize'
import { AMOUNT_INPUT_STYLES } from '@universe/transactions-ui/src/common/AmountInput/amountInputStyles'
import { type Ref, useState } from 'react'

/** `indicative`: an estimate or a held value, dimmed. `error`: the amount exceeds the balance. */
export type AmountInputState = 'default' | 'indicative' | 'error'

export interface AmountInputSelection {
  start: number
  end?: number
}

export interface AmountInputProps {
  /** Caller-owned, display-ready: locale separators already applied (replaceSeparators). */
  value: string
  /** The text as typed. The adapter parses separators, caps decimals and rejects non-numbers. */
  onChangeValue: (text: string) => void
  /** Default `0`. */
  placeholder?: string
  state?: AmountInputState
  /** Before the amount at the same size and color, e.g. the fiat symbol in fiat mode. */
  prefix?: string
  /** After the amount in a dimmer color, e.g. the token symbol. The input then hugs its text. */
  suffix?: string
  /** The font shrinks between these to fit the field. Default 36 to 24. */
  fontSizeRange?: AmountFontSizeRange
  /**
   * A size the host computes itself, e.g. the old stepped sizing that measures the field once
   * and holds the last size while the field is empty and unfocused. Overrides `fontSizeRange`.
   */
  fontSize?: number
  /** Layout of the field the amount fills, prefix excluded, for a host that computes `fontSize`. */
  onFieldLayout?: AnimatedFlexProps['onLayout']
  disabled?: boolean
  /** A press on the disabled input, e.g. explaining why exact output is unavailable. */
  onPressDisabled?: () => void
  autoFocus?: boolean
  onPressIn?: () => void
  onBlur?: InputProps['onBlur']
  /**
   * Native: `false` (default) keeps the soft keyboard down while the host's decimal pad
   * types into the field. Toggling it remounts the input so the keyboard state applies.
   */
  showSoftInputOnFocus?: boolean
  /** Native only, caller-owned: where the decimal pad puts the caret. Web ignores it. */
  selection?: AmountInputSelection
  onSelectionChange?: (selection: { start: number; end: number }) => void
  /** For focus and blur. */
  inputRef?: Ref<Input>
  /**
   * Adapter-owned animation on the amount, the refetch pulse today. It runs on Reanimated
   * on native, so the hook stays adapter side and only its style comes in.
   */
  animatedStyle?: AnimatedFlexProps['style']
  testID?: string
}

const STATE_COLOR = {
  default: '$neutral1',
  indicative: '$neutral3',
  error: '$statusCritical',
} as const satisfies Record<AmountInputState, string>

// Keeps the caret visible when the input hugs its text.
const CURSOR_PADDING_PX = 3

/**
 * The large amount field: optional prefix, the input with its font shrinking to fit, an
 * optional suffix. The value is caller-owned; parsing and formatting stay in the adapter.
 *
 * Same interaction on every platform. The native decimal pad is the host's: with
 * `showSoftInputOnFocus` false it types into this field through `value` and `selection`,
 * so it needs no separate view.
 *
 * Replaces the amount half of CurrencyInputPanelInput and the markup of AmountInput
 * (components/AmountInput); useCurrencyInputFontSize becomes getAmountFontSize.
 */
export function AmountInput({
  value,
  onChangeValue,
  placeholder = '0',
  state = 'default',
  prefix,
  suffix,
  fontSizeRange = DEFAULT_AMOUNT_FONT_SIZE_RANGE,
  fontSize: hostFontSize,
  onFieldLayout,
  disabled = false,
  onPressDisabled,
  autoFocus,
  onPressIn,
  onBlur,
  showSoftInputOnFocus = false,
  selection,
  onSelectionChange,
  inputRef,
  animatedStyle,
  testID,
}: AmountInputProps): JSX.Element {
  const [availableWidth, setAvailableWidth] = useState(0)
  const [textWidth, setTextWidth] = useState<number | undefined>(undefined)

  const text = value || placeholder
  const fontSize = hostFontSize ?? getAmountFontSize({ text, availableWidth, range: fontSizeRange })
  const lineHeight = fontSize * AMOUNT_LINE_HEIGHT_RATIO
  const color = STATE_COLOR[state]
  const hugsText = suffix !== undefined
  const hasLongPrefix = (prefix?.length ?? 0) > 1

  return (
    <Flex fill grow row alignItems="center">
      {prefix !== undefined && (
        <Text
          allowFontScaling
          $platform-native={hasLongPrefix ? { mr: '$spacing4' } : undefined}
          color={color}
          fontSize={fontSize}
          lineHeight={lineHeight}
          mr={hasLongPrefix ? '$spacing2' : undefined}
        >
          {prefix}
        </Text>
      )}
      <AnimatedFlex
        fill
        grow
        row
        alignItems="center"
        minHeight={DEFAULT_AMOUNT_FONT_SIZE_RANGE.min}
        mr="$spacing8"
        style={animatedStyle}
        // Measured once, like the old sizing hook: the field's width does not depend on its text.
        onLayout={(event) => {
          // Read now: the updater runs after this handler returns, when native has already
          // released the event and nativeEvent is null.
          const { width: measuredWidth } = event.nativeEvent.layout
          setAvailableWidth((width) => width || measuredWidth)
          onFieldLayout?.(event)
        }}
      >
        <Flex fill row flexShrink={AMOUNT_INPUT_STYLES.fieldShrink}>
          {disabled && (
            // Catches presses on the disabled input so the host can explain why.
            <TouchableArea height="100%" position="absolute" width="100%" zIndex={1} onPress={onPressDisabled} />
          )}
          {/* Hidden twin of the input text. With a suffix its width sizes the input. Always rendered:
              iOS reads the panel as one button, and the input's value is missing from its label. */}
          <Text
            fontFamily="$heading"
            fontSize={fontSize}
            fontWeight="500"
            height={0}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            numberOfLines={1}
            overflow="hidden"
            pointerEvents="none"
            position="absolute"
            onLayout={
              hugsText ? (event) => setTextWidth(event.nativeEvent.layout.width + CURSOR_PADDING_PX) : undefined
            }
          >
            {text}
          </Text>
          <Input
            // A changed keyboard mode only applies to a fresh input.
            key={showSoftInputOnFocus ? 'soft-keyboard' : 'no-soft-keyboard'}
            ref={inputRef}
            autoComplete="off"
            autoFocus={autoFocus}
            backgroundColor="$transparent"
            borderRadius={0}
            borderWidth="$none"
            color={color}
            disabled={disabled}
            flex={1}
            focusable={!disabled}
            fontFamily="$heading"
            fontSize={fontSize}
            fontWeight="$book"
            height="auto"
            keyboardType="decimal-pad"
            lineHeight={lineHeight}
            maxFontSizeMultiplier={fonts.heading2.maxFontSizeMultiplier}
            minHeight={lineHeight}
            overflow="visible"
            placeholder={placeholder}
            placeholderTextColor="$neutral3"
            px="$none"
            py="$none"
            returnKeyType={showSoftInputOnFocus ? 'done' : undefined}
            selection={AMOUNT_INPUT_STYLES.applySelection ? selection : undefined}
            selectionColor="$neutral3"
            showSoftInputOnFocus={showSoftInputOnFocus}
            testID={testID}
            value={value}
            width={hugsText ? textWidth : undefined}
            onBlur={onBlur}
            onChangeText={onChangeValue}
            onPressIn={onPressIn}
            onSelectionChange={(event) => onSelectionChange?.(event.nativeEvent.selection)}
          />
          {hugsText && (
            <Text allowFontScaling color="$neutral2" fontSize={fontSize} lineHeight={lineHeight} ml="$spacing4">
              {suffix}
            </Text>
          )}
        </Flex>
      </AnimatedFlex>
    </Flex>
  )
}
