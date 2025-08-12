import { useCallback, useMemo } from 'react'
import { SwapSummaryCallbacks } from 'uniswap/src/components/activity/types'
import {
  ActivityRenderData,
  UseActivityDataProps,
  useActivityData,
} from 'uniswap/src/features/activity/hooks/useActivityData'
import { useMostRecentSwapTx } from 'uniswap/src/features/transactions/swap/hooks/useMostRecentSwapTx'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useRestOnRampAuth } from 'wallet/src/features/activity/useRestOnRampAuth'
import { useCreateSwapFormState } from 'wallet/src/features/transactions/hooks/useCreateSwapFormState'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export function useActivityDataWallet(
  props: Omit<UseActivityDataProps, 'swapCallbacks' | 'ownerAddresses' | 'fiatOnRampParams'>,
): ActivityRenderData {
  const { navigateToSwapFlow } = useWalletNavigation()
  const ownerAddresses = Object.keys(useAccounts())

  const fiatOnRampParams = useRestOnRampAuth(props.owner)

  const onRetryGenerator = useCallback(
    (swapFormState: TransactionState | undefined): (() => void) => {
      if (!swapFormState) {
        return () => {}
      }
      return () => {
        navigateToSwapFlow({ initialState: swapFormState })
      }
    },
    [navigateToSwapFlow],
  )

  const swapCallbacks: SwapSummaryCallbacks = useMemo(() => {
    return {
      useLatestSwapTransaction: useMostRecentSwapTx,
      useSwapFormTransactionState: useCreateSwapFormState,
      onRetryGenerator,
    }
  }, [onRetryGenerator])

  return useActivityData({
    ...props,
    ownerAddresses,
    swapCallbacks,
    fiatOnRampParams,
  })
}
