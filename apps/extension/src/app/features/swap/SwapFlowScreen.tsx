import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { SwapFlow } from 'wallet/src/features/transactions/swap/SwapFlow'
import { useSwapPrefilledState } from 'wallet/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SwapFlowScreen(): JSX.Element {
  const { navigateBack, locationState } = useExtensionNavigation()

  const swapPrefilledState = useSwapPrefilledState(locationState?.initialTransactionState)
  const account = useActiveAccountWithThrow()

  return (
    <Flex fill p="$spacing12">
      <SwapFlow
        account={account}
        prefilledState={swapPrefilledState}
        walletNeedsRestore={false}
        onClose={navigateBack}
      />
    </Flex>
  )
}
