import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useSetOverrideOneClickSwapFlag } from '~/pages/Swap/settings/OneClickSwap'

type OnPressRetryFn = () => void

/** Returns a retry handler for a given error. */
function createGetOnPressRetry(ctx: {
  disableOneClickSwap: () => void
}): (error: Error | undefined) => OnPressRetryFn | undefined {
  return function onPressRetry(error: Error | undefined) {
    if (error instanceof TransactionStepFailedError) {
      // Only show batched-specific retry UI if the first step failed
      // Handles scenarios where plan cannot disable one-click swap beyond first step.
      const shouldDisableOneClickSwap = !error.stepIndex || error.stepIndex === 0

      if (error.step.type === TransactionStepType.SwapTransactionBatched && shouldDisableOneClickSwap) {
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
