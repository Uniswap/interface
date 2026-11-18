import {
  AnimatedFlex,
  type AnimatedFlexProps,
  type ColorTokens,
  Flex,
  fonts,
  iconSizes,
  spacing,
  Text,
  TouchableArea,
} from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { SettingsStepButton } from '@universe/transactions-ui/src/common/SettingsStepButton/SettingsStepButton'
import { SLIPPAGE_SCREEN_STYLES } from '@universe/transactions-ui/src/common/SlippageScreen/slippageScreenStyles'
import type { SlippageWarningLevel } from '@universe/transactions-ui/src/common/types'
import { type ComponentType, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** Raw styles the view hands its text input, computed from theme tokens. */
export interface SlippageScreenTextInputStyle {
  color: string
  fontSize: number
  width: number
  padding: number
  fontFamily?: string
}

/**
 * What the view passes to `TextInputComponent`. A subset of React Native TextInput props,
 * so the native bottom sheet's text input satisfies it as-is.
 */
export interface SlippageScreenTextInputProps {
  value: string
  onChangeText: (text: string) => void
  onFocus: () => void
  onBlur: () => void
  keyboardType: 'numeric'
  textAlign: 'center'
  style: SlippageScreenTextInputStyle
}

/** The worst case the tolerance allows, shown under the input. */
export interface SlippageScreenAmount {
  /** Exact-input trades read "Receive at least", exact-output trades "Spend at most". */
  isExactInput: boolean
  /** Amount with symbol, e.g. `0.9950 ETH`. */
  formattedAmount: string
}

/** Text and icon color of a message line: the level's status color, else neutral2. */
function getMessageColor(warningLevel: SlippageWarningLevel | undefined): ColorTokens {
  if (warningLevel === 'critical') {
    return '$statusCritical'
  }
  if (warningLevel === 'warning') {
    return '$statusWarning'
  }
  return '$neutral2'
}

export interface SlippageScreenInputProps {
  /** Controlled input text, as typed. While auto is on the caller passes the current tolerance (`0.5`). */
  value: string
  /** Raw text on every keystroke. The caller validates, normalizes `,` and decides whether to take it. */
  onChangeValue: (next: string) => void
  /** Editing starts. The caller turns auto off and clears the text here. */
  onFocus?: () => void
  /** Editing ends. The caller commits the value or falls back to auto here. */
  onBlur?: () => void
  /** Turns auto back on. Ignored while `isZero`. */
  onPressAuto: () => void
  /** `critical` paints the typed value red. `warning` leaves it neutral1, as the old screen did. */
  warningLevel?: SlippageWarningLevel
  /** The transaction carries no slippage: a fixed `0.00` on the filled background, Auto inert. */
  isZero?: boolean
  /**
   * Renders the text input. Native passes the bottom sheet's text input (keyboard handling
   * belongs to the sheet, which this package must not import). Counts as a slot.
   */
  TextInputComponent: ComponentType<SlippageScreenTextInputProps>
  /** The caller's shake style for rejected input (`useShakeAnimation().shakeStyle`, a Reanimated style). */
  shakeStyle?: AnimatedFlexProps['style']
}

/**
 * The rounded tolerance pill on the native slippage screen: Auto, the value, a percent
 * sign. Focus is visual state, so it lives here; the text is the caller's.
 *
 * Replaces the AnimatedFlex block of SlippageScreenNative.
 */
export function SlippageScreenInput({
  value,
  onChangeValue,
  onFocus,
  onBlur,
  onPressAuto,
  warningLevel,
  isZero = false,
  TextInputComponent,
  shakeStyle,
}: SlippageScreenInputProps): JSX.Element {
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
    <AnimatedFlex
      row
      alignItems="center"
      backgroundColor={isEditing || isZero ? '$surface2' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      gap="$spacing12"
      p="$spacing16"
      style={shakeStyle}
    >
      <TouchableArea onPress={isZero ? undefined : onPressAuto}>
        <Text color="$accent1" variant="buttonLabel2">
          {t('swap.settings.slippage.control.auto')}
        </Text>
      </TouchableArea>
      {isZero ? (
        <Text color="$neutral2" textAlign="center" variant="subheading1">
          0.00
        </Text>
      ) : (
        <TextInputComponent
          keyboardType="numeric"
          style={{
            color: warningLevel === 'critical' ? colors.statusCritical.val : colors.neutral1.val,
            fontSize: fonts.subheading1.fontSize,
            width: fonts.subheading1.fontSize * 4,
            padding: spacing.none,
            fontFamily: SLIPPAGE_SCREEN_STYLES.inputFontFamily,
          }}
          textAlign="center"
          value={value}
          onBlur={handleBlur}
          onChangeText={onChangeValue}
          onFocus={handleFocus}
        />
      )}
      <Flex width={iconSizes.icon28}>
        <Text color="$neutral2" textAlign="center" variant="subheading1">
          %
        </Text>
      </Flex>
    </AnimatedFlex>
  )
}

export interface SlippageScreenMessageProps {
  /** Input feedback, e.g. "Enter a value larger than 0" or "High slippage". Wins over `amount`. */
  errorMessage?: string
  /** Set when the transaction carries no slippage. Wins over everything, in neutral2 without an icon. */
  noSlippageReason?: string
  /** Omit when there is no quote yet: an empty line holds the space. */
  amount?: SlippageScreenAmount
  /** Colors `errorMessage` and adds the "higher than necessary" line under `amount`. */
  warningLevel?: SlippageWarningLevel
}

function SlippageNoteLine({
  text,
  color,
  showAlert,
}: {
  text: string
  color: ColorTokens
  showAlert: boolean
}): JSX.Element {
  return (
    <Flex row centered px="$spacing12" gap="$spacing8" height={fonts.body3.lineHeight * 2 + spacing.spacing8}>
      {showAlert && <AlertTriangleFilled color={color} size="$icon.16" />}
      <Text color={color} textAlign="center" variant="body3">
        {text}
      </Text>
    </Flex>
  )
}

/**
 * The line under the tolerance pill, in the old precedence: the no-slippage reason, the
 * input error, the worst-case amount, or an empty line while there is no quote.
 *
 * Replaces SlippageMessage, WarningMessage and the bridging branch of SlippageScreenNative.
 */
export function SlippageScreenMessage({
  errorMessage,
  noSlippageReason,
  amount,
  warningLevel,
}: SlippageScreenMessageProps): JSX.Element {
  const { t } = useTranslation()
  const color = getMessageColor(warningLevel)

  if (noSlippageReason) {
    return <SlippageNoteLine showAlert={false} text={noSlippageReason} color="$neutral2" />
  }

  if (errorMessage) {
    return <SlippageNoteLine showAlert text={errorMessage} color={color} />
  }

  if (!amount) {
    return <Flex height={fonts.body2.lineHeight} />
  }

  return (
    <Flex centered gap="$spacing8" py="$spacing4">
      <Text color="$neutral2" textAlign="center" variant="body2">
        {amount.isExactInput
          ? t('swap.settings.slippage.input.receive.title')
          : t('swap.settings.slippage.output.spend.title')}{' '}
        {amount.formattedAmount}
      </Text>
      {warningLevel ? (
        <Flex centered row gap="$spacing8">
          <AlertTriangleFilled color={color} size="$icon.16" />
          {/* The old screen painted this text warning even when the icon was critical. */}
          <Text color="$statusWarning" variant="body2">
            {t('swap.settings.slippage.warning.message')}
          </Text>
        </Flex>
      ) : null}
    </Flex>
  )
}

export interface SlippageScreenProps
  extends Omit<SlippageScreenInputProps, 'isZero'>, Omit<SlippageScreenMessageProps, 'noSlippageReason'> {
  /** Plus: the caller adds its step (0.1 today) and clamps. */
  onPressIncrement: () => void
  /** Minus: the caller subtracts its step and clamps at 0. */
  onPressDecrement: () => void
  /** The tolerance is 0: minus disables. */
  isAtMinimum?: boolean
  /** The tolerance is at the custom maximum: plus disables. */
  isAtMaximum?: boolean
  /**
   * Set when the transaction carries no slippage (a swap bridge: "No slippage when swapping
   * across networks"). The description and Learn more hide, every control goes inert, the
   * pill shows `0.00` and this text replaces the message.
   */
  noSlippageReason?: string
  /** Shows "Learn more" under the description. The host opens the article. */
  onPressLearnMore?: () => void
}

/**
 * The native slippage screen opened from the Max slippage settings row: description,
 * Learn more, the minus / tolerance / plus stepper, and the message line. Typing uses the
 * system numeric keyboard through `TextInputComponent`. No presets today.
 *
 * Replaces the markup of SlippageScreenNative (swap SwapFormSettings). Web and extension
 * edit slippage inline in the settings popover instead: SlippageInlineInput.
 */
export function SlippageScreen({
  onPressIncrement,
  onPressDecrement,
  isAtMinimum = false,
  isAtMaximum = false,
  noSlippageReason,
  onPressLearnMore,
  errorMessage,
  amount,
  ...inputProps
}: SlippageScreenProps): JSX.Element {
  const { t } = useTranslation()
  const isZero = Boolean(noSlippageReason)

  return (
    <Flex centered gap="$spacing16">
      {!isZero && (
        <Text color="$neutral2" textAlign="center" variant="body2">
          {t('swap.settings.slippage.description')}
        </Text>
      )}
      {/* No press scale or opacity, like the TouchableTextLink this replaces. */}
      {!isZero && onPressLearnMore && (
        <TouchableArea activeOpacity={0} scaleTo={1} onPress={onPressLearnMore}>
          <Text color="$accent1" variant="buttonLabel2">
            {t('common.button.learn')}
          </Text>
        </TouchableArea>
      )}
      <Flex gap="$spacing12">
        <Flex centered row gap="$spacing16" mt="$spacing12">
          <SettingsStepButton direction="decrement" disabled={isAtMinimum || isZero} onPress={onPressDecrement} />
          <SlippageScreenInput {...inputProps} isZero={isZero} />
          <SettingsStepButton direction="increment" disabled={isAtMaximum || isZero} onPress={onPressIncrement} />
        </Flex>
        <SlippageScreenMessage
          amount={amount}
          errorMessage={errorMessage}
          noSlippageReason={noSlippageReason}
          warningLevel={inputProps.warningLevel}
        />
      </Flex>
    </Flex>
  )
}
