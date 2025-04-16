import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'

export const useIsAmountSelectionInvalid = (): boolean => {
  const { exactAmountToken, exactAmountFiat } = useSwapFormContext()

  return !exactAmountFiat && !exactAmountToken
}
