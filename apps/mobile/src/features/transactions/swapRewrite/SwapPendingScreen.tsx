import { useCallback } from 'react'
import { SwapStatus } from 'src/features/transactions/swap/SwapStatus'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'

export function SwapPendingScreen(): JSX.Element {
  const { setScreen } = useSwapScreenContext()
  const { derivedSwapInfo, onClose } = useSwapFormContext()

  const onTryAgain = useCallback(() => {
    setScreen(SwapScreen.SwapReview)
  }, [setScreen])

  return <SwapStatus derivedSwapInfo={derivedSwapInfo} onNext={onClose} onTryAgain={onTryAgain} />
}
