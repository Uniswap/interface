import { getEarnDepositMinimumValidation } from 'uniswap/src/features/earn/amount'
import { EARN_INPUT_ERROR_DEBOUNCE_MS } from 'uniswap/src/features/earn/constants'
import { useDebounce } from 'utilities/src/time/timing'

export function useEarnDepositAmountInlineErrors({
  exactAmountFiat,
  hasInputAmount,
  isConversionPending,
  isOverBalance,
  isWithdrawLiquidityLimited,
  isWithdrawing,
  minimumDepositLocalFiat,
}: {
  exactAmountFiat: string
  hasInputAmount: boolean
  isConversionPending?: boolean
  isOverBalance: boolean
  isWithdrawLiquidityLimited: boolean
  isWithdrawing: boolean
  minimumDepositLocalFiat: number
}): {
  debouncedIsOverWithdrawableLiquidity: boolean
  isBelowMinimumDeposit: boolean
  showMinimumDepositInlineError: boolean
} {
  const isBelowMinimumDeposit =
    !isConversionPending &&
    getEarnDepositMinimumValidation({
      hasInputAmount,
      inputAmount: Number(exactAmountFiat) || 0,
      minimumAmount: minimumDepositLocalFiat,
    })
  const debouncedShowMinimumDepositInlineError = useDebounce(
    !isWithdrawing && isBelowMinimumDeposit,
    EARN_INPUT_ERROR_DEBOUNCE_MS,
  )
  const showMinimumDepositInlineError =
    !isWithdrawing && isBelowMinimumDeposit && debouncedShowMinimumDepositInlineError
  const isOverWithdrawableLiquidity = isWithdrawing && isWithdrawLiquidityLimited && isOverBalance
  const debouncedIsOverWithdrawableLiquidity = useDebounce(isOverWithdrawableLiquidity, EARN_INPUT_ERROR_DEBOUNCE_MS)

  return { debouncedIsOverWithdrawableLiquidity, isBelowMinimumDeposit, showMinimumDepositInlineError }
}
