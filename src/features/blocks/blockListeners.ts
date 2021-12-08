/**
 * Watchers for new blocks and updates the latest block info for all
 * providerManager's chains. Shares similar responsibility to app updater in web:
 * https://github.com/Uniswap/interface/blob/main/src/state/application/updater.ts
 */

import { providers } from 'ethers'
import { eventChannel, EventChannel } from 'redux-saga'
import { ChainId } from 'src/constants/chains'
import { updateLatestBlock } from 'src/features/blocks/blocksSlice'
import { BlockUpdate } from 'src/features/blocks/types'
import { logger } from 'src/utils/logger'
import { put, take } from 'typed-redux-saga'

export function createBlockChannel(provider: providers.Provider, chainId: ChainId) {
  return eventChannel<BlockUpdate>((emit) => {
    const blockHandler = (blockNumber: number) => {
      emit({ blockNumber, chainId })
    }
    provider.on('block', blockHandler)

    // Return cleanup method to unsubscribe
    return () => {
      provider.off('block', blockHandler)
    }
  })
}

export function* blockChannelWatcher(channel: EventChannel<BlockUpdate>, chainId: ChainId) {
  try {
    logger.debug('blockListeners', 'blockChannelWatcher', 'Watching block channel for:', chainId)
    while (true) {
      const block = yield* take(channel)
      // TODO validate block
      yield* put(
        updateLatestBlock({ chainId: block.chainId, latestBlockNumber: block.blockNumber })
      )
    }
  } finally {
    logger.debug('blockListeners', 'blockChannelWatcher', 'Closing block channel for:', chainId)
    channel.close()
  }
}
