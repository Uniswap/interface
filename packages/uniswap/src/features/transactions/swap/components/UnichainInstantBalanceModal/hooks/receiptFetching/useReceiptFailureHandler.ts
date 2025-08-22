import { useCallback } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import {
  NO_OUTPUT_ERROR,
  resetSwapFormAndReturnToForm,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/receiptFetching/utils'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { logger } from 'utilities/src/logger/logger'
import { isMobileApp } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface ReceiptFailureParams {
  error: unknown
  fetcherIdAndStartTime: number
  retryFunction: () => void
}

export function useReceiptFailureHandler(): (params: ReceiptFailureParams) => void {
  const { setScreen } = useTransactionModalContext()
  const chainId = useSwapDependenciesStore((s) => s.derivedSwapInfo.chainId)
  const updateSwapForm = useSwapFormStore((s) => s.updateSwapForm)

  const handleReceiptFailure = useCallback(
    ({ error, fetcherIdAndStartTime, retryFunction }: ReceiptFailureParams): void => {
      logger.error(error, {
        tags: { file: 'useReceiptFailureHandler', function: 'handleReceiptFailure' },
      })

      const isReceiptFetchedAndProcessed = error instanceof Error && error.message === NO_OUTPUT_ERROR
      const hasTimeRemaining = Date.now() - fetcherIdAndStartTime < FLASHBLOCKS_INSTANT_BALANCE_TIMEOUT

      if (hasTimeRemaining && !isReceiptFetchedAndProcessed) {
        // Retry with delay based on subblock time
        const retryDelay = (getChainInfo(chainId).subblockTimeMs || ONE_SECOND_MS) / (isMobileApp ? 2 : 4)
        setTimeout(retryFunction, retryDelay)
        return
      }

      if (isReceiptFetchedAndProcessed) {
        // Receipt was fetched but no output amount found - show modal without amount
        setScreen(TransactionScreen.UnichainInstantBalance)
      } else {
        // Timeout or other error - reset form and return to form screen
        resetSwapFormAndReturnToForm({ updateSwapForm, setScreen })
      }
    },
    [chainId, setScreen, updateSwapForm],
  )

  return handleReceiptFailure
}
