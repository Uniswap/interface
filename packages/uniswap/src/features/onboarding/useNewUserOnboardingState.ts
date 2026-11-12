import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { ListTransactionsResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { PlanStatus } from '@uniswap/client-data-api/dist/data/v1/plan_pb'
import {
  OnChainTransactionStatus,
  type Transaction,
  TransactionTypeFilter,
  UniswapXTransactionStatus,
} from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getListTransactionsQuery } from 'uniswap/src/data/apiClients/dataApiService/activity/listTransactions'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import type { NewUserOnboardingWalletHistory } from 'uniswap/src/features/behaviorHistory/newUserOnboarding'
import { selectNewUserOnboardingWalletHistory } from 'uniswap/src/features/behaviorHistory/selectors'
import { setNewUserOnboardingWalletFlag } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import type { UniswapState } from 'uniswap/src/state/uniswapReducer'

export interface NewUserOnboardingState {
  /** The `new_user_ux` flag is on and a wallet is connected. */
  isActive: boolean
  isReturningUser: boolean
  /**
   * Checklist, guided swap and post-swap banner. Only true once the wallet is confirmed unfunded or
   * unswapped, so a failed balance or swap history read keeps them hidden. Each surface still hides
   * its own finished steps.
   */
  showOnboardingNudges: boolean
  /** Surfaces should render nothing while this is true. */
  isLoading: boolean
  isFunded: boolean
  hasSwapped: boolean
  hasDismissedGuidedSwap: boolean
}

// Enough rows that a few failed or unfilled attempts don't hide a completed swap behind them
const SWAP_HISTORY_PAGE_SIZE = 10

/** The `SWAP` filter also returns failed swaps and open, expired or cancelled UniswapX orders. */
function isCompletedRemoteSwap({ transaction }: PlainMessage<Transaction>): boolean {
  switch (transaction.case) {
    case 'onChain':
      return transaction.value.status === OnChainTransactionStatus.CONFIRMED
    case 'uniswapX':
      return transaction.value.status === UniswapXTransactionStatus.FILLED
    case 'plan':
      return transaction.value.status === PlanStatus.COMPLETED && !transaction.value.earnMetadata
    default:
      return false
  }
}

const selectHasCompletedSwap = (data: PlainMessage<ListTransactionsResponse> | undefined): boolean =>
  !!data?.transactions.some(isCompletedRemoteSwap)

/** `undefined` until confirmed either way. */
function getIsFunded({
  walletHistory,
  isTestnetModeEnabled,
  balanceUSD,
}: {
  walletHistory: NewUserOnboardingWalletHistory | undefined
  isTestnetModeEnabled: boolean
  balanceUSD: number | undefined
}): boolean | undefined {
  // Testnet balances are always denominated as $0
  if (walletHistory?.hasBeenFunded || isTestnetModeEnabled) {
    return true
  }
  return balanceUSD === undefined ? undefined : balanceUSD > 0
}

export function getNewUserOnboardingState({
  isActive,
  walletHistory,
  isTestnetModeEnabled,
  balanceUSD,
  isBalanceLoading,
  hasRemoteSwap,
  isSwapHistoryLoading,
}: {
  isActive: boolean
  walletHistory: NewUserOnboardingWalletHistory | undefined
  isTestnetModeEnabled: boolean
  /** `undefined` when unknown: loading, failed or placeholder. */
  balanceUSD: number | undefined
  isBalanceLoading: boolean
  /** `undefined` when unknown: loading, failed or placeholder. */
  hasRemoteSwap: boolean | undefined
  isSwapHistoryLoading: boolean
}): NewUserOnboardingState {
  const isFunded = getIsFunded({ walletHistory, isTestnetModeEnabled, balanceUSD })
  const hasSwapped = walletHistory?.hasCompletedSwap ? true : hasRemoteSwap

  const isLoading =
    isActive && ((isFunded === undefined && isBalanceLoading) || (hasSwapped === undefined && isSwapHistoryLoading))
  const isReturningUser = isFunded === true && hasSwapped === true

  return {
    isActive,
    isReturningUser,
    showOnboardingNudges: isActive && !isLoading && (isFunded === false || hasSwapped === false),
    isLoading,
    isFunded: isFunded === true,
    hasSwapped: hasSwapped === true,
    hasDismissedGuidedSwap: !!walletHistory?.guidedSwapDismissed,
  }
}

/**
 * Single source of truth for where the active wallet is in the new user onboarding. Reads the
 * `new_user_ux` flag, so surfaces don't check it themselves.
 */
export function useNewUserOnboardingState(): NewUserOnboardingState {
  const dispatch = useDispatch()
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  const { isTestnetModeEnabled, chains } = useEnabledChains()

  const { evmAddress, svmAddress } = useActiveAddresses()
  const address = evmAddress ?? svmAddress
  const isActive = isNewUserUxEnabled && !!address

  const walletHistory = useSelector((state: UniswapState) => selectNewUserOnboardingWalletHistory(state, address))

  // Same params as the account drawer so the cache entry is shared
  const {
    data: portfolioData,
    isPending: isBalancePending,
    isPlaceholderData: isBalancePlaceholder,
  } = usePortfolioTotalValue({
    evmAddress,
    svmAddress,
    enabled: isActive && !walletHistory?.hasBeenFunded,
  })
  // Placeholder data is the previous wallet's result, so persisting from it would mark the wrong wallet
  const balanceUSD = isBalancePlaceholder ? undefined : portfolioData?.balanceUSD

  // The local flag only knows swaps made on this browser or device
  const shouldFetchSwapHistory = isActive && !walletHistory?.hasCompletedSwap
  const {
    data: remoteSwapData,
    isPending: isSwapHistoryPending,
    isPlaceholderData: isSwapHistoryPlaceholder,
  } = useQuery(
    getListTransactionsQuery({
      input: {
        evmAddress,
        svmAddress,
        chainIds: chains,
        filterTransactionTypes: [TransactionTypeFilter.SWAP],
        pageSize: SWAP_HISTORY_PAGE_SIZE,
      },
      enabled: shouldFetchSwapHistory,
      select: selectHasCompletedSwap,
    }),
  )
  const hasRemoteSwap = isSwapHistoryPlaceholder ? undefined : remoteSwapData

  const shouldPersistFunded =
    isActive && !walletHistory?.hasBeenFunded && !isTestnetModeEnabled && (balanceUSD ?? 0) > 0
  useEffect(() => {
    if (address && shouldPersistFunded) {
      dispatch(setNewUserOnboardingWalletFlag({ address, flag: 'hasBeenFunded' }))
    }
  }, [address, dispatch, shouldPersistFunded])

  const shouldPersistSwapped = shouldFetchSwapHistory && !!hasRemoteSwap
  useEffect(() => {
    if (address && shouldPersistSwapped) {
      dispatch(setNewUserOnboardingWalletFlag({ address, flag: 'hasCompletedSwap' }))
    }
  }, [address, dispatch, shouldPersistSwapped])

  return getNewUserOnboardingState({
    isActive,
    walletHistory,
    isTestnetModeEnabled,
    balanceUSD,
    isBalanceLoading: isBalancePending || !!isBalancePlaceholder,
    hasRemoteSwap,
    isSwapHistoryLoading: isSwapHistoryPending || isSwapHistoryPlaceholder,
  })
}
