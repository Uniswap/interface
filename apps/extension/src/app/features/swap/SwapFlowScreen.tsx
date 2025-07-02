import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { logger } from 'utilities/src/logger/logger'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { invalidateAndRefetchWalletDelegationQueries } from 'wallet/src/features/transactions/watcher/transactionFinalizationSaga'
import { useActiveAccountWithThrow, useSignerAccounts } from 'wallet/src/features/wallet/hooks'

export function SwapFlowScreen(): JSX.Element {
  const { navigateBack, locationState } = useExtensionNavigation()
  const { defaultChainId } = useEnabledChains()
  const account = useActiveAccountWithThrow()
  const ignorePersistedFilteredChainIds = !!locationState?.initialTransactionState
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId(
    account.address,
    !ignorePersistedFilteredChainIds ? persistedFilteredChainIds?.[CurrencyField.INPUT] : undefined,
  )
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

  /** Initialize the initial state once. On navigation the locationState changes causing an unwanted re-render. */
  const [initialTransactionState] = useState(() => locationState?.initialTransactionState ?? initialState)

  const swapPrefilledState = useSwapPrefilledState(initialTransactionState)

  return (
    <Flex fill p="$spacing12">
      <WalletSwapFlow prefilledState={swapPrefilledState} walletNeedsRestore={false} onClose={navigateBack} />
    </Flex>
  )
}
