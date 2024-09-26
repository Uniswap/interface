import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
// eslint-disable-next-line no-restricted-imports -- type imports are safe
import type { StyleProp, ViewStyle } from 'react-native'
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useHapticFeedback } from 'ui/src'
import { errorShakeAnimation } from 'ui/src/animations/errorShakeAnimation'
import { PlusMinusButtonType } from 'ui/src/components/button/PlusMinusButton'
import { MAX_AUTO_SLIPPAGE_TOLERANCE, MAX_CUSTOM_SLIPPAGE_TOLERANCE } from 'uniswap/src/constants/transactions'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

const SLIPPAGE_INCREMENT = 0.1

export function useSlippageSettings(): {
  isEditingSlippage: boolean
  autoSlippageEnabled: boolean
  showSlippageWarning: boolean
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
  const { t } = useTranslation()

  const { derivedSwapInfo, updateSwapForm } = useSwapFormContext()
  const { customSlippageTolerance, autoSlippageTolerance: derivedAutoSlippageTolerance } = derivedSwapInfo

  const [isEditingSlippage, setIsEditingSlippage] = useState<boolean>(false)
  const [autoSlippageEnabled, setAutoSlippageEnabled] = useState<boolean>(!customSlippageTolerance)
  const [inputSlippageTolerance, setInputSlippageTolerance] = useState<string>(
    customSlippageTolerance?.toFixed(2)?.toString() ?? '',
  )
  const [inputWarning, setInputWarning] = useState<string | undefined>()
  const { hapticFeedback } = useHapticFeedback()

  // Fall back to default slippage if there is no trade specified.
  // Separate from inputSlippageTolerance since autoSlippage updates when the trade quote updates
  const autoSlippageTolerance = derivedAutoSlippageTolerance ?? MAX_AUTO_SLIPPAGE_TOLERANCE

  // Determine numerical currentSlippage value to use based on inputSlippageTolerance string value
  // ex. if inputSlippageTolerance is '' or '.', currentSlippage is set to autoSlippageTolerance
  const parsedInputSlippageTolerance = parseFloat(inputSlippageTolerance)
  const currentSlippageToleranceNum = isNaN(parsedInputSlippageTolerance)
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
    updateSwapForm({ customSlippageTolerance: undefined })
  }

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
      const moreThanTwoDecimals = decimalParts?.[1] && decimalParts?.[1].length > 2
      const isZero = parsedValue === 0

      if (isZero) {
        setInputSlippageTolerance('')
        setInputWarning(t('swap.settings.slippage.warning.min'))
      }

      if (overMaxTolerance) {
        setInputWarning(
          t('swap.settings.slippage.warning.max', {
            maxSlippageTolerance: MAX_CUSTOM_SLIPPAGE_TOLERANCE,
          }),
        )
        setInputSlippageTolerance('')
      }

      /* Prevent invalid updates to input value with animation and haptic
       * isZero is intentionally left out here because the user should be able to type "0"
       * without the input shaking (ex. typing 0.x shouldn't shake after typing char)
       */
      if (isZero || isInvalidNumber || overMaxTolerance || moreThanOneDecimalSymbol || moreThanTwoDecimals) {
        inputShakeX.value = errorShakeAnimation(inputShakeX)
        await hapticFeedback.impact()
        return
      }

      setInputSlippageTolerance(value)
      updateSwapForm({ customSlippageTolerance: parsedValue })
    },
    [hapticFeedback, inputShakeX, updateSwapForm, t],
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
      updateSwapForm({ customSlippageTolerance: undefined })
      return
    }

    setInputSlippageTolerance(parsedInputSlippageTolerance.toFixed(2))
  }, [parsedInputSlippageTolerance, updateSwapForm])

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

      if (constrainedNewSlippage === 0) {
        setInputWarning(t('swap.settings.slippage.warning.min'))
      } else {
        setInputWarning(undefined)
      }

      setInputSlippageTolerance(constrainedNewSlippage.toFixed(2).toString())
      updateSwapForm({ customSlippageTolerance: constrainedNewSlippage })
    },
    [autoSlippageEnabled, currentSlippageToleranceNum, updateSwapForm, t],
  )

  return {
    isEditingSlippage,
    autoSlippageEnabled,
    showSlippageWarning,
    inputSlippageTolerance,
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
