import { useIsAmountSelectionInvalid } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsAmountSelectionInvalid'
import { useIsTokenSelectionInvalid } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsTokenSelectionInvalid'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/hooks/useIsTradeIndicative'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'

export const useIsBlockingWithCustomMessage = (): boolean => {
  const isTokenSelectionInvalid = useIsTokenSelectionInvalid()
  const isAmountSelectionInvalid = useIsAmountSelectionInvalid()
  const { insufficientBalanceWarning, insufficientGasFundsWarning } = useParsedSwapWarnings()
  const isIndicative = useIsTradeIndicative()

  return Boolean(
    isTokenSelectionInvalid ||
      isAmountSelectionInvalid ||
      insufficientBalanceWarning ||
      insufficientGasFundsWarning ||
      isIndicative,
  )
}
