import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { useHighestBalanceNativeCurrencyId } from 'uniswap/src/features/dataApi/balances'
import { usePortfolioValueModifiers } from 'wallet/src/features/dataApi/balances'
import { WalletSwapFlow } from 'wallet/src/features/transactions/swap/WalletSwapFlow'
import { useSwapPrefilledState } from 'wallet/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { prepareSwapFormState } from 'wallet/src/features/transactions/swap/utils'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwapFlowScreen(): JSX.Element {
  const { navigateBack, locationState } = useExtensionNavigation()
  const account = useActiveAccountWithThrow()
  const valueModifiers = usePortfolioValueModifiers(account.address)
  const inputCurrencyId = useHighestBalanceNativeCurrencyId(account.address, valueModifiers)
  const initialState = prepareSwapFormState({ inputCurrencyId })

  const swapPrefilledState = useSwapPrefilledState(locationState?.initialTransactionState ?? initialState)

  return (
    <Flex fill p="$spacing12">
      <WalletSwapFlow prefilledState={swapPrefilledState} walletNeedsRestore={false} onClose={navigateBack} />
    </Flex>
  )
}
