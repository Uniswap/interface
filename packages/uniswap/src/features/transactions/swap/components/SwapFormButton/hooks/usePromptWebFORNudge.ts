import { useIsShowingWebFORNudge } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsWebFORNudgeActive } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsWebFORNudgeActive'

/** Whether the swap button is currently an Add funds CTA: drives both its styling and its press action. */
export function usePromptWebFORNudge(): boolean {
  const isWebFORNudgeActive = useIsWebFORNudgeActive()
  const isShowingWebFORNudge = useIsShowingWebFORNudge()
  const { swapRedirectCallback } = useTransactionModalContext()

  return isWebFORNudgeActive && !swapRedirectCallback && !isShowingWebFORNudge
}
