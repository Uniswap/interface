import { Flex, Input, Text } from '@universe/mycelium'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const INPUT_WIDTH = 44

export interface DeadlineInlineInputProps {
  /** Controlled input text, as typed (`30`, `''`). */
  value: string
  /** The deadline in effect, in minutes. Picks the unit's plural ("minute" or "minutes"). */
  minutes: number
  /** Raw text on every keystroke. The caller validates, clamps and saves. */
  onChangeValue: (next: string) => void
  /** Editing starts: a press anywhere on the pill, or the input taking focus. */
  onFocus?: () => void
  /** Editing ends. The caller falls back to the default deadline here when the text is empty. */
  onBlur?: () => void
  testID?: string
}

/**
 * The deadline editor inside the web and extension settings popover: a minutes input on a
 * pill, with the unit after it. Rendered as the value of the Swap deadline SettingsRow, for
 * swap and for web Liquidity; the warning line under the row title is the row's `warning`.
 *
 * Not SlippageInlineInput with another unit: this one has no Auto pill and no warning tint,
 * keeps a fixed input width, and focuses the input on a press anywhere on the pill.
 *
 * Replaces the markup of DeadlineControl.web. Focus is visual state, so it lives here; the
 * text is the caller's. Native edits the deadline on its own screen instead: DeadlineScreen.
 */
export function DeadlineInlineInput({
  value,
  minutes,
  onChangeValue,
  onFocus,
  onBlur,
  testID,
}: DeadlineInlineInputProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<Input>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
    }
  }, [isEditing])

  function handleFocus(): void {
    setIsEditing(true)
    onFocus?.()
  }

  function handleBlur(): void {
    setIsEditing(false)
    onBlur?.()
  }

  return (
    <Flex
      row
      group
      alignItems="center"
      justifyContent="space-between"
      style={{ containerType: 'normal' }}
      testID={testID}
    >
      <Flex
        row
        backgroundColor={isEditing ? '$surface2' : '$surface1'}
        borderColor={isEditing ? '$accent1' : '$surface3'}
        borderRadius="$rounded16"
        $group-hover={{ borderColor: '$surface3Hovered', backgroundColor: '$surface1Hovered' }}
        borderWidth="$spacing1"
        gap="$spacing8"
        p="$spacing4"
        onPress={handleFocus}
      >
        <Flex row alignItems="center" pr="$spacing8" gap="$spacing4">
          {/* Transparent so the row's background (and its group-hover swap) shows through — the
              compat Input's groupHoverStyle only binds to legacy t_group anchors (INFRA-3958). */}
          <Input
            ref={inputRef}
            backgroundColor="$transparent"
            color="$neutral1"
            editable={true}
            fontFamily="$subHeading"
            fontWeight="normal"
            fontSize="$small"
            height="100%"
            keyboardType="numeric"
            outlineColor="$transparent"
            p="$none"
            textAlign="right"
            value={value}
            width={INPUT_WIDTH}
            onBlur={handleBlur}
            onChangeText={onChangeValue}
            onFocus={handleFocus}
          />
          <Text color="$neutral2" variant="subheading2">
            {t('common.minutes.lowercase', { count: minutes })}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
