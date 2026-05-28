import { useCallback, useMemo } from 'react'
import type { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import type { SwapSummaryCallbacks } from 'uniswap/src/components/activity/types'
import {
  type ActivityRenderData,
  type UseActivityDataProps,
  useActivityData,
} from 'uniswap/src/features/activity/hooks/useActivityData'
import { useMostRecentSwapTx } from 'uniswap/src/features/transactions/swap/hooks/useMostRecentSwapTx'
import type { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useRestOnRampAuth } from 'wallet/src/features/activity/useRestOnRampAuth'
import { useCreateSwapFormState } from 'wallet/src/features/transactions/hooks/useCreateSwapFormState'
import { useAccounts } from 'wallet/src/features/wallet/hooks'

export function useActivityDataWallet(
  props: Omit<UseActivityDataProps, 'swapCallbacks' | 'ownerAddresses' | 'fiatOnRampParams'>,
): Omit<ActivityRenderData, 'sectionData'> & {
  sectionData: ActivityItem[]
} {
  const { navigateToSwapFlow } = useWalletNavigation()

  const accounts = useAccounts()
  const ownerAddresses = useMemo(() => Object.keys(accounts), [accounts])

  const fiatOnRampParams = useRestOnRampAuth(props.evmOwner ?? '')

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

  const activityData = useActivityData({
    ...props,
    ownerAddresses,
    swapCallbacks,
    fiatOnRampParams,
  })

  return useMemo(
    () => ({
      ...activityData,
      sectionData: activityData.sectionData ?? [],
    }),
    [activityData],
  )
}
