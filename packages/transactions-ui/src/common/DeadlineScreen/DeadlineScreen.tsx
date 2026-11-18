import { Flex, fonts, spacing, Text, TouchableArea } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { DEADLINE_SCREEN_STYLES } from '@universe/transactions-ui/src/common/DeadlineScreen/deadlineScreenStyles'
import { SettingsStepButton } from '@universe/transactions-ui/src/common/SettingsStepButton/SettingsStepButton'
import type { SlippageScreenTextInputProps } from '@universe/transactions-ui/src/common/SlippageScreen/SlippageScreen'
import { type ComponentType, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * What the view passes to `TextInputComponent`: the slippage screen's contract, right-aligned
 * so the value sits against its unit.
 */
export type DeadlineScreenTextInputProps = Omit<SlippageScreenTextInputProps, 'textAlign'> & { textAlign: 'right' }

export interface DeadlineScreenProps {
  /** Controlled input text, as typed (`30`, `''`). */
  value: string
  /** The deadline in effect, in minutes. Picks the unit's plural ("minute" or "minutes"). */
  minutes: number
  /** Raw text on every keystroke. The caller validates, clamps and saves. */
  onChangeValue: (next: string) => void
  /** Editing starts. */
  onFocus?: () => void
  /** Editing ends. The caller falls back to the default deadline here when the text is empty. */
  onBlur?: () => void
  /** Plus: the caller adds its step (5 minutes today) and clamps. */
  onPressIncrement: () => void
  /** Minus: the caller subtracts its step and clamps. */
  onPressDecrement: () => void
  /** The deadline is at the minimum: minus disables. */
  isAtMinimum?: boolean
  /** The deadline is at the maximum: plus disables. */
  isAtMaximum?: boolean
  /** Shows "Learn more" under the description. The host opens the article. */
  onPressLearnMore?: () => void
  /**
   * Renders the text input. Native passes the bottom sheet's text input (keyboard handling
   * belongs to the sheet, which this package must not import). Counts as a slot.
   */
  TextInputComponent: ComponentType<DeadlineScreenTextInputProps>
  /** Slot: the line under the stepper, a WarningLine or nothing. It reserves no height. */
  warning?: ReactNode
}

/**
 * The native deadline screen opened from the Swap deadline settings row: description, Learn
 * more, the minus / minutes / plus stepper, and the warning line. Typing uses the system
 * numeric keyboard through `TextInputComponent`.
 *
 * Not SlippageScreen with another unit: there is no Auto, no rejected-input shake and no
 * message precedence, and the pill, input and unit are spaced for a word instead of `%`. Both
 * screens share SettingsStepButton.
 *
 * Replaces the markup of DeadlineScreen.native (components/settings, rendered by the swap
 * settings). Web and extension edit the deadline inline in the settings popover instead:
 * DeadlineInlineInput.
 */
export function DeadlineScreen({
  value,
  minutes,
  onChangeValue,
  onFocus,
  onBlur,
  onPressIncrement,
  onPressDecrement,
  isAtMinimum = false,
  isAtMaximum = false,
  onPressLearnMore,
  TextInputComponent,
  warning,
}: DeadlineScreenProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [isEditing, setIsEditing] = useState(false)

  function handleFocus(): void {
    setIsEditing(true)
    onFocus?.()
  }

  function handleBlur(): void {
    setIsEditing(false)
    onBlur?.()
  }

  return (
    <Flex centered gap="$spacing16">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {t('swap.settings.deadline.tooltip')}
      </Text>
      {/* No press scale or opacity, like the TouchableTextLink this replaces. */}
      {onPressLearnMore && (
        <TouchableArea activeOpacity={0} scaleTo={1} onPress={onPressLearnMore}>
          <Text color="$accent1" variant="buttonLabel2">
            {t('common.button.learn')}
          </Text>
        </TouchableArea>
      )}
      <Flex gap="$spacing12">
        <Flex centered row gap="$spacing16" mt="$spacing12">
          <SettingsStepButton direction="decrement" disabled={isAtMinimum} onPress={onPressDecrement} />
          <Flex
            row
            alignItems="center"
            backgroundColor={isEditing ? '$surface2' : '$surface1'}
            borderColor="$surface3"
            borderRadius="$roundedFull"
            borderWidth="$spacing1"
            gap="$spacing8"
            p="$spacing16"
          >
            <TextInputComponent
              keyboardType="numeric"
              style={{
                color: colors.neutral1.val,
                fontSize: fonts.subheading1.fontSize,
                width: fonts.subheading1.fontSize * 3,
                padding: spacing.none,
                fontFamily: DEADLINE_SCREEN_STYLES.inputFontFamily,
              }}
              textAlign="right"
              value={value}
              onBlur={handleBlur}
              onChangeText={onChangeValue}
              onFocus={handleFocus}
            />
            <Text color="$neutral2" variant="subheading1">
              {t('common.minutes.lowercase', { count: minutes })}
            </Text>
          </Flex>
          <SettingsStepButton direction="increment" disabled={isAtMaximum} onPress={onPressIncrement} />
        </Flex>
        <Flex centered>{warning}</Flex>
      </Flex>
    </Flex>
  )
}
