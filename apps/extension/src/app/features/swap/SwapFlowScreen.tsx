import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { useEnabledChains } from 'nextrade/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'nextrade/src/features/dataApi/balances'
import { selectFilteredChainIds } from 'nextrade/src/features/transactions/swap/contexts/selectors'
import { useSwapPrefilledState } from 'nextrade/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { prepareSwapFormState } from 'nextrade/src/features/transactions/types/transactionState'
import { CurrencyField } from 'nextrade/src/types/currency'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

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

  /** Initialize the initial state once. On navigation the locationState changes causing an unwanted re-render. */
  const [initialTransactionState] = useState(() => locationState?.initialTransactionState ?? initialState)

  const swapPrefilledState = useSwapPrefilledState(initialTransactionState)

  return (
    <Flex fill p="$spacing12">
      <WalletSwapFlow prefilledState={swapPrefilledState} walletNeedsRestore={false} onClose={navigateBack} />
    </Flex>
  )
}
