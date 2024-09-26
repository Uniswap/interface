import { useCallback, useState } from 'react'

import { MAX_CUSTOM_DEADLINE } from 'uniswap/src/constants/transactions'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

export const DEFAULT_CUSTOM_DEADLINE = 30

export function useDeadlineSettings(): {
  isEditingDeadline: boolean
  showDeadlineWarning: boolean
  inputDeadline: string
  currentDeadline: number
  onChangeDeadlineInput: (value: string) => void
  onFocusDeadlineInput: () => void
  onBlurDeadlineInput: () => void
} {
  const { derivedSwapInfo, updateSwapForm } = useSwapFormContext()
  const { customDeadline } = derivedSwapInfo

  const [isEditingDeadline, setIsEditingDeadline] = useState<boolean>(false)
  const [inputDeadline, setInputDeadline] = useState<string>(
    customDeadline?.toString() || DEFAULT_CUSTOM_DEADLINE.toString(),
  )

  // Determine numerical currentDeadline value to use based on inputDeadline string value
  // ex. if inputDeadline is '' or '.', currentDeadline is set to default deadline
  const parsedInputDeadline = parseFloat(inputDeadline)
  const currentDeadlineNum = isNaN(parsedInputDeadline) ? DEFAULT_CUSTOM_DEADLINE : parsedInputDeadline

  // Make input text the warning color if user is setting custom deadline higher than auto deadline value or 0
  const showDeadlineWarning = parsedInputDeadline > MAX_CUSTOM_DEADLINE

  const onChangeDeadlineInput = useCallback(
    async (value: string): Promise<void> => {
      // Handle keyboards that use `,` as decimal separator
      value = value.replace(',', '.')

      // Allow empty input value and single decimal point
      if (value === '' || value === '.') {
        setInputDeadline(value)
        return
      }

      const parsedValue = parseFloat(value)

      // Validate input
      const overMaxDeadline = parsedValue > MAX_CUSTOM_DEADLINE
      const isZero = parsedValue === 0

      if (isZero) {
        setInputDeadline('0')
        updateSwapForm({ customDeadline: DEFAULT_CUSTOM_DEADLINE })
        return
      }

      if (overMaxDeadline) {
        setInputDeadline(MAX_CUSTOM_DEADLINE.toString())
        updateSwapForm({ customDeadline: MAX_CUSTOM_DEADLINE })
        return
      }

      setInputDeadline(value)
      updateSwapForm({ customDeadline: parsedValue })
    },
    [updateSwapForm],
  )

  const onFocusDeadlineInput = useCallback((): void => {
    setIsEditingDeadline(true)
  }, [])

  const onBlurDeadlineInput = useCallback(() => {
    setIsEditingDeadline(false)

    if (isNaN(parsedInputDeadline)) {
      updateSwapForm({ customDeadline: undefined })
      return
    }
  }, [parsedInputDeadline, updateSwapForm])

  return {
    isEditingDeadline,
    showDeadlineWarning,
    inputDeadline,
    currentDeadline: currentDeadlineNum,
    onChangeDeadlineInput,
    onFocusDeadlineInput,
    onBlurDeadlineInput,
  }
}
