import { getAtomicSupportedChainIds } from 'state/walletCapabilities/lib/handleGetCapabilities'
import type { GetCapabilitiesResult } from 'state/walletCapabilities/lib/types'
import { WalletCapabilitiesState } from 'state/walletCapabilities/types'
import { Logger } from 'utilities/src/logger/logger'
import { deepEqual } from 'wagmi'

export function createOnSetCapabilitiesByChainEffect(ctx: {
  getOriginalState: () => { walletCapabilities: WalletCapabilitiesState }
  onAtomicSupportedChainIdsDetected: (chainIds: number[]) => void
  onWalletCapabilitiesDetected: (chainCapabilitiesResult: GetCapabilitiesResult) => void
  logger?: Logger
}) {
  const { getOriginalState, onAtomicSupportedChainIdsDetected, onWalletCapabilitiesDetected, logger } = ctx
  return (action: { payload: GetCapabilitiesResult }) => {
    const state = getOriginalState()
    const existingCapabilities = state.walletCapabilities.byChain

    // bail if the capabilities are the same
    if (deepEqual(existingCapabilities, action.payload)) {
      logger?.info('reducer.ts', 'createOnSetCapabilitiesByChainEffect', 'wallet capabilities are the same')
      return
    }

    const atomicSupportedChainIds = getAtomicSupportedChainIds(action.payload)

    if (atomicSupportedChainIds.length > 0) {
      logger?.info('reducer.ts', 'createOnSetCapabilitiesByChainEffect', 'atomic supported chain ids detected', {
        atomicSupportedChainIds,
      })
      onAtomicSupportedChainIdsDetected(atomicSupportedChainIds)
    }

    // track wallet capabilities for each chain
    onWalletCapabilitiesDetected(action.payload)
    logger?.info('reducer.ts', 'createOnSetCapabilitiesByChainEffect', 'wallet capabilities detected', {
      payload: action.payload,
    })
  }
}
