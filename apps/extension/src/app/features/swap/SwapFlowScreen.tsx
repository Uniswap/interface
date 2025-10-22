import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances/balances'
import { clearNotificationQueue } from 'uniswap/src/features/notifications/slice/slice'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState, TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { invalidateAndRefetchWalletDelegationQueries } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { useActiveAccountWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function SwapFlowScreen(): JSX.Element {
  const dispatch = useDispatch()
  const { navigateBack, locationState } = useExtensionNavigation()
  const { defaultChainId } = useEnabledChains()
  const account = useActiveAccountWithThrow()
  const ignorePersistedFilteredChainIds = !!locationState?.initialTransactionState
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId({
    evmAddress: account.address,
    chainId: !ignorePersistedFilteredChainIds ? persistedFilteredChainIds?.[CurrencyField.INPUT] : undefined,
  })
  const initialState = prepareSwapFormState({
    inputCurrencyId,
    defaultChainId,
    filteredChainIdsOverride: ignorePersistedFilteredChainIds ? undefined : persistedFilteredChainIds,
  })

  const signerMnemonicAccounts = useSignerAccounts()
  const chains = useEnabledChains()
  const accountAddresses = signerMnemonicAccounts.map((account) => account.address)

  // Update flow start timestamp every time modal is opened for logging
  useEffect(() => {
    invalidateAndRefetchWalletDelegationQueries({ accountAddresses, chainIds: chains.chains }).catch((error) =>
      logger.debug('SwapFlowScreen', 'useEffect', 'Failed to invalidate and refetch wallet delegation queries', error),
    )
  }, [accountAddresses, chains.chains])

  const preservedTransactionStateRef = useRef<TransactionState | null>(null)
  const initialTransactionState = useMemo(() => {
    if (locationState?.initialTransactionState) {
      preservedTransactionStateRef.current = locationState.initialTransactionState
      return locationState.initialTransactionState
    }

    // If we have a previously preserved state, use it (prevents reset when navigating away from the swap flow)
    if (preservedTransactionStateRef.current) {
      return preservedTransactionStateRef.current
    }

    // Only fallback to initialState if we've never had any transaction state (first time opening the swap flow)
    preservedTransactionStateRef.current = initialState
    return initialState
  }, [locationState?.initialTransactionState, initialState])

  const swapPrefilledState = useSwapPrefilledState(initialTransactionState)

  // Clear all notification toasts when the swap flow closes
  const onClose = useCallback(() => {
    dispatch(clearNotificationQueue())
    navigateBack()
  }, [dispatch, navigateBack])

  return (
    <Flex fill p="$spacing12">
      <WalletSwapFlow prefilledState={swapPrefilledState} walletNeedsRestore={false} onClose={onClose} />
    </Flex>
  )
}
