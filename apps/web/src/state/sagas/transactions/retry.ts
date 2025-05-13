import { useSetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { useEvent } from 'utilities/src/react/hooks'

type OnPressRetryFn = () => void

/** Returns a retry handler for a given error. */
function createGetOnPressRetry(ctx: {
  disableOneClickSwap: () => void
}): (error: Error | undefined) => OnPressRetryFn | undefined {
  return function onPressRetry(error: Error | undefined) {
    if (error instanceof TransactionStepFailedError) {
      if (error.step.type === TransactionStepType.SwapTransactionBatched) {
        return ctx.disableOneClickSwap
      }
    }

    return undefined
  }
}

export function useGetOnPressRetry(): (error: Error | undefined) => (() => void) | undefined {
  const disableOneClickSwap = useSetOverrideOneClickSwapFlag()
  return useEvent(createGetOnPressRetry({ disableOneClickSwap }))
}
