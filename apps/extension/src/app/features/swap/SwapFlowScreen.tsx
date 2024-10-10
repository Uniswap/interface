import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { prepareSwapFormState } from 'uniswap/src/features/transactions/types/transactionState'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwapFlowScreen(): JSX.Element {
  const { navigateBack, locationState } = useExtensionNavigation()
  const { defaultChainId } = useEnabledChains()
  const account = useActiveAccountWithThrow()
  const inputCurrencyId = useHighestBalanceNativeCurrencyId(account.address)
  const initialState = prepareSwapFormState({ inputCurrencyId, defaultChainId })

  const swapPrefilledState = useSwapPrefilledState(locationState?.initialTransactionState ?? initialState)

  return (
    <Flex fill p="$spacing12">
      <WalletSwapFlow prefilledState={swapPrefilledState} walletNeedsRestore={false} onClose={navigateBack} />
    </Flex>
  )
}
