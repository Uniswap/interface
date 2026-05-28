import { useEffect, useRef } from 'react'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Hook that detects changes to chainIds and fires a callback when changes occur.
 * Can be used by components that need to respond to chain ID changes.
 */
export function useChainIdsChangeEffect({
  inputChainId,
  outputChainId,
  onChainIdsChanged,
  skipInitialCallback = true,
}: ChainIdsChangeParams): void {
  const prevChainsRef = useRef<SwapChains>({
    inputChainId: undefined,
    outputChainId: undefined,
  })

  const isFirstRunRef = useRef<boolean>(true)

  useEffect(() => {
    if (!onChainIdsChanged) {
      return
    }

    const currentChains: SwapChains = { inputChainId, outputChainId }
    const prevChains = prevChainsRef.current

    // Skip first callback if requested (but still update the ref)
    if (isFirstRunRef.current && skipInitialCallback) {
      isFirstRunRef.current = false
      prevChainsRef.current = currentChains
      return
    }

    // Check if chains have changed
    const hasInputChanged = inputChainId !== prevChains.inputChainId
    const hasOutputChanged = outputChainId !== prevChains.outputChainId

    // Only call callback if something changed
    if (hasInputChanged || hasOutputChanged) {
      onChainIdsChanged({
        currentChains,
        prevChains,
        hasInputChanged,
        hasOutputChanged,
      })
    }

    // Always update previous chains
    prevChainsRef.current = currentChains
    isFirstRunRef.current = false
  }, [inputChainId, outputChainId, onChainIdsChanged, skipInitialCallback])
}

export interface SwapChains {
  inputChainId?: UniverseChainId
  outputChainId?: UniverseChainId
}

export type ChainIdsChangeCallback = (params: {
  currentChains: SwapChains
  prevChains: SwapChains
  hasInputChanged: boolean
  hasOutputChanged: boolean
}) => void

export interface ChainIdsChangeParams {
  inputChainId?: UniverseChainId
  outputChainId?: UniverseChainId
  /**
   * Callback fired when chain IDs change.
   * This callback should be stable (wrapped with useEvent) to prevent unnecessary re-renders.
   * It receives information about the current and previous chains, along with which chains changed.
   */
  onChainIdsChanged?: ChainIdsChangeCallback
  /**
   * Whether to skip the initial callback invocation when the hook first mounts.
   * Defaults to true to prevent unwanted side effects during component initialization.
   */
  skipInitialCallback?: boolean
}
