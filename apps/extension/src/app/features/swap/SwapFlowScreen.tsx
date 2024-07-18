import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Flex } from 'ui/src'
import { SwapFlow } from 'wallet/src/features/transactions/swap/SwapFlow'
import { useSwapPrefilledState } from 'wallet/src/features/transactions/swap/hooks/useSwapPrefilledState'

export function SwapFlowScreen(): JSX.Element {
  const { navigateBack, locationState } = useExtensionNavigation()

  const swapPrefilledState = useSwapPrefilledState(locationState?.initialTransactionState)

  return (
    <Flex fill p="$spacing12">
      <SwapFlow prefilledState={swapPrefilledState} walletNeedsRestore={false} onClose={navigateBack} />
    </Flex>
  )
}
