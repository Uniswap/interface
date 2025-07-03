import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

export const useIsAmountSelectionInvalid = (): boolean => {
  const { exactAmountToken, exactAmountFiat } = useSwapFormContext()

  // Cast string to number to ensure that string "0" is treated as falsy
  return !Number(exactAmountFiat) && !Number(exactAmountToken)
}
