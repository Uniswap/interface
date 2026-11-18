import { type ColorTokens, Flex, type FlexProps, Input, Text, type TextProps } from '@universe/mycelium'
import type { SlippageWarningLevel } from '@universe/transactions-ui/src/common/types'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const INPUT_MIN_WIDTH = 14

type TextLayoutEvent = Parameters<NonNullable<TextProps['onLayout']>>[0]

export interface SlippageInlineInputProps {
  /**
   * Controlled input text, as typed (`0.5`, `1.`, `''`). While auto is on the caller
   * passes the auto tolerance unformatted (`0.5`), which is what the input shows.
   */
  value: string
  /** Raw text on every keystroke. The caller validates, normalizes `,` and decides whether to take it. */
  onChangeValue: (next: string) => void
  /** Auto is on: the Auto pill fills and the value renders in neutral2. */
  isAuto: boolean
  /** Value and border paint in the level's status color. */
  warningLevel?: SlippageWarningLevel
  /** Turns auto back on. The caller clears its custom value. */
  onPressAuto: () => void
  /** Editing starts (press in). The caller turns auto off and clears the text here. */
  onFocus?: () => void
  /** Editing ends. The caller commits the value or falls back to auto here. */
  onBlur?: () => void
  /**
   * The caller's shake style for rejected input (`useShakeAnimation().shakeStyle`). The
   * shake is triggered by the caller's validation and runs on the legacy animation hook, so
   * it stays adapter side; the view only applies it to the pill.
   */
  shakeStyle?: FlexProps['style']
  testID?: string
}

function getValueColor(warningLevel: SlippageWarningLevel | undefined, isAuto: boolean): ColorTokens {
  if (warningLevel === 'critical') {
    return '$statusCritical'
  }
  if (warningLevel === 'warning') {
    return '$statusWarning'
  }
  return isAuto ? '$neutral2' : '$neutral1'
}

function getBorderColor(warningLevel: SlippageWarningLevel | undefined, isEditing: boolean): ColorTokens {
  if (warningLevel === 'critical') {
    return '$statusCritical'
  }
  if (warningLevel === 'warning') {
    return '$statusWarning'
  }
  return isEditing ? '$accent1' : '$surface3'
}

function getHoverBorderColor(warningLevel: SlippageWarningLevel | undefined): ColorTokens {
  if (warningLevel === 'critical') {
    return '$statusCriticalHovered'
  }
  if (warningLevel === 'warning') {
    return '$statusWarningHovered'
  }
  return '$surface3Hovered'
}

/**
 * The slippage editor inside the web and extension settings popover: an Auto pill and a
 * custom percent input that grows with its text. Rendered as the value of the Max slippage
 * SettingsRow, for swap and for web Liquidity; the warning line under the row title is the
 * row's `warning`, not part of this view.
 *
 * Replaces the markup of SlippageControl.web (components/settings, used directly by LP and
 * through the swap SlippageControl.web wrapper). Focus and the measured input width are
 * visual state, so they live here; the text, auto and the warning level are the caller's.
 * Native edits slippage on its own screen instead: SlippageScreen.
 */
export function SlippageInlineInput({
  value,
  onChangeValue,
  isAuto,
  warningLevel,
  onPressAuto,
  onFocus,
  onBlur,
  shakeStyle,
  testID,
}: SlippageInlineInputProps): JSX.Element {
  const { t } = useTranslation()
  const inputRef = useRef<Input>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [inputWidth, setInputWidth] = useState(0)
  const [isLayoutReady, setIsLayoutReady] = useState(false)

  // Kept from SlippageControl as-is: blur once the hidden text has been measured.
  useEffect(() => {
    inputRef.current?.blur()
  }, [isLayoutReady])

  function onInputTextLayout(event: TextLayoutEvent): void {
    setInputWidth(event.nativeEvent.layout.width)
    setIsLayoutReady(true)
  }

  function handlePressIn(): void {
    setIsEditing(true)
    onFocus?.()
  }

  function handleBlur(): void {
    setIsEditing(false)
    onBlur?.()
  }

  const backgroundColor = isEditing ? '$surface2' : '$surface1'
  const valueColor = getValueColor(warningLevel, isAuto)

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
        backgroundColor={backgroundColor}
        borderColor={getBorderColor(warningLevel, isEditing)}
        borderRadius="$rounded16"
        borderWidth="$spacing1"
        gap="$spacing8"
        p="$spacing4"
        pr="$spacing8"
        style={shakeStyle}
        $group-hover={{
          borderColor: getHoverBorderColor(warningLevel),
          backgroundColor: '$surface1Hovered',
        }}
      >
        <Flex
          centered
          backgroundColor={isAuto ? '$accent2' : '$surface3'}
          borderRadius="$roundedFull"
          px="$spacing8"
          onPress={onPressAuto}
        >
          <Text color={isAuto ? '$accent1' : '$neutral2'} variant="buttonLabel3">
            {t('swap.settings.slippage.control.auto')}
          </Text>
        </Flex>
        <Flex row alignItems="center" paddingEnd="$spacing12" paddingStart="$spacing4">
          <Flex style={{ position: 'relative' }}>
            <Input
              ref={inputRef}
              keyboardType="decimal-pad"
              backgroundColor={backgroundColor}
              groupHoverStyle={{ backgroundColor: '$surface1Hovered' }}
              color={valueColor}
              editable={true}
              fontFamily="$subHeading"
              fontWeight="normal"
              fontSize="$small"
              height="100%"
              outlineColor="$transparent"
              p="$none"
              paddingEnd="$spacing4"
              textAlign="right"
              value={value}
              width={inputWidth}
              onBlur={handleBlur}
              onChangeText={onChangeValue}
              onPressIn={handlePressIn}
            />
            {/* Hidden copy of the value: its measured width sizes the input. */}
            <Text
              minWidth={INPUT_MIN_WIDTH}
              opacity={0}
              px="$spacing4"
              style={{ position: 'absolute' }}
              variant="subheading2"
              zIndex={-1}
              onLayout={onInputTextLayout}
            >
              {value}
            </Text>
          </Flex>
          <Text color={valueColor} variant="subheading2">
            %
          </Text>
        </Flex>
      </Flex>
    </Flex>
  )
}
