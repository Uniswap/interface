import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  SwapChains,
  useChainIdsChangeEffect,
} from 'uniswap/src/features/transactions/swap/contexts/hooks/useChainIdsChangeEffect'
import { useEvent } from 'utilities/src/react/hooks'

export function useSwapNetworkChangeEffect({
  inputChainId,
  outputChainId,
}: {
  inputChainId?: UniverseChainId
  outputChainId?: UniverseChainId
}): void {
  const { onSwapChainsChanged } = useUniswapContext()

  const onChainIdsChanged = useEvent(
    ({
      currentChains,
      prevChains,
    }: {
      currentChains: SwapChains
      prevChains: SwapChains
      hasInputChanged: boolean
      hasOutputChanged: boolean
    }) => {
      const { inputChainId: currentInputChainId, outputChainId: currentOutputChainId } = currentChains
      const { inputChainId: lastInputChainId, outputChainId: lastOutputChainId } = prevChains
      const prevChainId = lastInputChainId ?? lastOutputChainId

      // Determine notification type and trigger
      if (currentInputChainId && currentOutputChainId && currentInputChainId !== currentOutputChainId) {
        onSwapChainsChanged({ chainId: currentInputChainId, outputChainId: currentOutputChainId }) // Bridging notification
      } else if (currentInputChainId || (currentOutputChainId && prevChainId)) {
        const chainId = currentInputChainId ?? currentOutputChainId
        // User is swapping on the same chain, don't show notification
        if (!chainId || chainId === prevChainId) {
          return
        }
        onSwapChainsChanged({ chainId, prevChainId }) // Non-bridging notification
      }
    },
  )

  const skipInitialCallback = !!inputChainId && !!outputChainId && inputChainId === outputChainId

  useChainIdsChangeEffect({
    inputChainId,
    outputChainId,
    onChainIdsChanged,
    skipInitialCallback,
  })
}
