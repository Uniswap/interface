import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

export const useIsAmountSelectionInvalid = (): boolean => {
  const { exactAmountToken, exactAmountFiat } = useSwapFormStore((s) => ({
    exactAmountToken: s.exactAmountToken,
    exactAmountFiat: s.exactAmountFiat,
  }))

  // Cast string to number to ensure that string "0" is treated as falsy
  return !Number(exactAmountFiat) && !Number(exactAmountToken)
}
