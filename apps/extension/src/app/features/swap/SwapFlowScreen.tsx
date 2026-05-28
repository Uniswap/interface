import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSmartWalletNudges } from 'src/app/context/SmartWalletNudgesContext'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/contexts/selectors'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import {
  SmartWalletDelegationAction,
  useSmartWalletDelegationStatus,
} from 'wallet/src/components/smartWallet/smartAccounts/hook'
import { selectShouldShowPostSwapNudge } from 'wallet/src/features/behaviorHistory/selectors'
import { setIncrementNumPostSwapNudge } from 'wallet/src/features/behaviorHistory/slice'
import { useIsChainSupportedBySmartWallet } from 'wallet/src/features/smartWallet/hooks/useSmartWalletChains'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { WalletState } from 'wallet/src/state/walletReducer'

export function SwapFlowScreen(): JSX.Element {
  const dispatch = useDispatch()

  const { navigateBack, locationState } = useExtensionNavigation()
  const { defaultChainId } = useEnabledChains()
  const account = useActiveAccountWithThrow()
  const ignorePersistedFilteredChainIds = !!locationState?.initialTransactionState
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)
  const { status: delegationStatus, loading: delegationStatusLoading } = useSmartWalletDelegationStatus({})
  const isSmartWalletEnabled = useFeatureFlag(FeatureFlags.SmartWallet)
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
  const { openModal, setDappInfo } = useSmartWalletNudges()
  const canShowPostSwapNudge = useSelector((state: WalletState) =>
    selectShouldShowPostSwapNudge(state, account.address),
  )
  const isSupportedSmartWalletChain = useIsChainSupportedBySmartWallet(swapPrefilledState?.filteredChainIds.input)

  const onSubmitSwap = useCallback(async () => {
    if (!isSmartWalletEnabled || delegationStatusLoading) {
      return
    }

    if (
      canShowPostSwapNudge &&
      delegationStatus === SmartWalletDelegationAction.PromptUpgrade &&
      isSupportedSmartWalletChain
    ) {
      openModal(ModalName.PostSwapSmartWalletNudge)
      setDappInfo(undefined)
      dispatch(setIncrementNumPostSwapNudge({ walletAddress: account.address }))
    }
  }, [
    delegationStatusLoading,
    isSmartWalletEnabled,
    delegationStatus,
    openModal,
    setDappInfo,
    dispatch,
    account.address,
    canShowPostSwapNudge,
    isSupportedSmartWalletChain,
  ])

  return (
    <Flex fill p="$spacing12">
      <WalletSwapFlow
        prefilledState={swapPrefilledState}
        walletNeedsRestore={false}
        onClose={navigateBack}
        onSubmitSwap={onSubmitSwap}
      />
    </Flex>
  )
}
