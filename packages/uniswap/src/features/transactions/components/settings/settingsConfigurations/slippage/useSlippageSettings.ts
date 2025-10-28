import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StyleProp, ViewStyle } from 'react-native'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'
import { PlusMinusButtonType } from 'ui/src/components/buttons/PlusMinusButton'
import {
  MAX_AUTO_SLIPPAGE_TOLERANCE,
  MAX_CUSTOM_SLIPPAGE_TOLERANCE,
  SLIPPAGE_CRITICAL_TOLERANCE,
} from 'uniswap/src/constants/transactions'
import {
  useTransactionSettingsActions,
  useTransactionSettingsAutoSlippageToleranceStore,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'

const SLIPPAGE_INCREMENT = 0.1

export interface SlippageSettingsProps {
  saveOnBlur?: boolean
  isZeroSlippage?: boolean
}

export function useSlippageSettings(params?: SlippageSettingsProps): {
  isEditingSlippage: boolean
  autoSlippageEnabled: boolean
  showSlippageWarning: boolean
  showSlippageCritical: boolean
  inputSlippageTolerance: string
  inputWarning: string | undefined
  autoSlippageTolerance: number
  currentSlippageTolerance: number
  inputAnimatedStyle: StyleProp<ViewStyle>
  onPressAutoSlippage: () => void
  onChangeSlippageInput: (value: string) => void
  onFocusSlippageInput: () => void
  onBlurSlippageInput: () => void
  onPressPlusMinusButton: (type: PlusMinusButtonType) => void
} {
  const { saveOnBlur, isZeroSlippage } = params ?? {}
  const { t } = useTranslation()

  const { customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
  }))
  const { setCustomSlippageTolerance } = useTransactionSettingsActions()
  const derivedAutoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((s) => s.autoSlippageTolerance)
  const actualAutoSlippageTolerance = isZeroSlippage ? 0 : derivedAutoSlippageTolerance

  const [isEditingSlippage, setIsEditingSlippage] = useState<boolean>(false)
  const [autoSlippageEnabled, setAutoSlippageEnabled] = useState<boolean>(!customSlippageTolerance)
  const [inputSlippageTolerance, setInputSlippageTolerance] = useState<string>(
    customSlippageTolerance?.toFixed(2).toString() ?? '',
  )
  const [inputWarning, setInputWarning] = useState<string | undefined>()

  // Get auto slippage tolerance or fallback to max auto slippage tolerance
  const autoSlippageTolerance = actualAutoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE

  // Determine numerical currentSlippage value to use based on inputSlippageTolerance string value
  // ex. if inputSlippageTolerance is '' or '.', currentSlippage is set to autoSlippageTolerance
  const parsedInputSlippageTolerance = parseFloat(inputSlippageTolerance)
  const currentSlippageToleranceNum = params?.isZeroSlippage
    ? 0
    : isNaN(parsedInputSlippageTolerance)
      ? autoSlippageTolerance
      : parsedInputSlippageTolerance

  // Make input text the warning color if user is setting custom slippage higher than auto slippage value or 0
  const showSlippageWarning = parsedInputSlippageTolerance > autoSlippageTolerance

  const inputShakeX = useSharedValue(0)
  const inputAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: inputShakeX.value }],
    }),
    [inputShakeX],
  )

  const onPressAutoSlippage = (): void => {
    setAutoSlippageEnabled(true)
    setInputWarning(undefined)
    setInputSlippageTolerance('')
    setCustomSlippageTolerance(undefined)
  }

  const updateInputWarning = useCallback(
    (parsedValue: number) => {
      const overMaxTolerance = parsedValue > MAX_CUSTOM_SLIPPAGE_TOLERANCE
      const overWarningTolerance = parsedValue > autoSlippageTolerance
      const overCriticalTolerance = parsedValue >= SLIPPAGE_CRITICAL_TOLERANCE
      const isZero = parsedValue === 0

      if (isZero) {
        return setInputWarning(t('swap.settings.slippage.warning.min'))
      } else if (overMaxTolerance) {
        return setInputWarning(
          t('swap.settings.slippage.warning.max', {
            maxSlippageTolerance: MAX_CUSTOM_SLIPPAGE_TOLERANCE,
          }),
        )
      } else if (overCriticalTolerance) {
        return setInputWarning(t('swap.settings.slippage.warning'))
      } else if (overWarningTolerance) {
        return setInputWarning(t('swap.settings.slippage.alert'))
      }

      return setInputWarning(undefined)
    },
    [autoSlippageTolerance, t],
  )

  const onChangeSlippageInput = useCallback(
    async (value: string): Promise<void> => {
      setAutoSlippageEnabled(false)
      setInputWarning(undefined)

      // Handle keyboards that use `,` as decimal separator
      value = value.replace(',', '.')

      // Allow empty input value and single decimal point
      if (value === '' || value === '.') {
        setInputSlippageTolerance(value)
        return
      }

      const parsedValue = parseFloat(value)

      // Validate input and prevent invalid updates with animation
      const isInvalidNumber = isNaN(parsedValue)
      const overMaxTolerance = parsedValue > MAX_CUSTOM_SLIPPAGE_TOLERANCE
      const decimalParts = value.split('.')
      const moreThanOneDecimalSymbol = decimalParts.length > 2
      const moreThanTwoDecimals = decimalParts[1] && decimalParts[1].length > 2
      const isZero = parsedValue === 0

      updateInputWarning(parsedValue)

      /* Prevent invalid updates to input value with animation and haptic
       * isZero is intentionally left out here because the user should be able to type "0"
       * without the input shaking (ex. typing 0.x shouldn't shake after typing char)
       */
      if (isInvalidNumber || overMaxTolerance || moreThanOneDecimalSymbol || moreThanTwoDecimals) {
        inputShakeX.value = errorShakeAnimation(inputShakeX)
        return
      }

      setInputSlippageTolerance(value)

      if (!saveOnBlur && !isZero) {
        setCustomSlippageTolerance(parsedValue)
      }
    },
    [updateInputWarning, saveOnBlur, setCustomSlippageTolerance],
  )

  const onFocusSlippageInput = useCallback((): void => {
    setIsEditingSlippage(true)

    // Clear the input if auto slippage is enabled
    if (autoSlippageEnabled) {
      setAutoSlippageEnabled(false)
      setInputSlippageTolerance('')
    }
  }, [autoSlippageEnabled])

  const onBlurSlippageInput = useCallback(() => {
    setIsEditingSlippage(false)

    // Set autoSlippageEnabled to true if input is invalid (ex. '' or '.')
    if (isNaN(parsedInputSlippageTolerance)) {
      setAutoSlippageEnabled(true)
      setCustomSlippageTolerance(undefined)
      return
    }

    setInputSlippageTolerance(parsedInputSlippageTolerance.toFixed(2))
    if (saveOnBlur) {
      setCustomSlippageTolerance(parsedInputSlippageTolerance)
    }
  }, [parsedInputSlippageTolerance, setCustomSlippageTolerance, saveOnBlur])

  const onPressPlusMinusButton = useCallback(
    (type: PlusMinusButtonType): void => {
      if (autoSlippageEnabled) {
        setAutoSlippageEnabled(false)
      }

      const newSlippage =
        currentSlippageToleranceNum + (type === PlusMinusButtonType.Plus ? SLIPPAGE_INCREMENT : -SLIPPAGE_INCREMENT)
      const constrainedNewSlippage =
        type === PlusMinusButtonType.Plus
          ? Math.min(newSlippage, MAX_CUSTOM_SLIPPAGE_TOLERANCE)
          : Math.max(newSlippage, 0)

      const isZero = constrainedNewSlippage === 0

      updateInputWarning(constrainedNewSlippage)

      setInputSlippageTolerance(constrainedNewSlippage.toFixed(2).toString())
      if (!isZero) {
        setCustomSlippageTolerance(constrainedNewSlippage)
      }
    },
    [autoSlippageEnabled, currentSlippageToleranceNum, updateInputWarning, setCustomSlippageTolerance],
  )

  return {
    isEditingSlippage,
    autoSlippageEnabled,
    showSlippageWarning,
    showSlippageCritical: parsedInputSlippageTolerance >= SLIPPAGE_CRITICAL_TOLERANCE,
    inputSlippageTolerance: autoSlippageEnabled
      ? currentSlippageToleranceNum.toFixed(2).toString()
      : inputSlippageTolerance,
    inputWarning,
    autoSlippageTolerance,
    currentSlippageTolerance: currentSlippageToleranceNum,
    inputAnimatedStyle,
    onPressAutoSlippage,
    onChangeSlippageInput,
    onFocusSlippageInput,
    onBlurSlippageInput,
    onPressPlusMinusButton,
  }
}
