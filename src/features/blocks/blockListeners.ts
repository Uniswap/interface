import { providers } from 'ethers'
import { eventChannel, EventChannel } from 'redux-saga'
import { getWalletProviders } from 'src/app/walletContext'
import { SupportedChainId } from 'src/constants/chains'
import { updateLatestBlock } from 'src/features/blocks/blocksSlice'
import { logger } from 'src/utils/logger'
import { getKeys } from 'src/utils/objects'
import { call, fork, put, take } from 'typed-redux-saga'

interface BlockUpdate {
  blockNumber: number
  chainId: SupportedChainId
}

/**
 * Watches for new blocks and updates the latest block info for all
 * providerManager's chains. Shares similar responsibility to app updater in web:
 * https://github.com/Uniswap/interface/blob/main/src/state/application/updater.ts
 */
export function* blockListeners() {
  logger.debug('Initiating block listeners')
  const manager = yield* call(getWalletProviders)
  const providerMap = manager.getAllProviders()

  const channels: Array<EventChannel<BlockUpdate>> = []
  for (const chainId of getKeys(providerMap)) {
    const provider = providerMap[chainId]!
    channels.push(createBlockChannel(provider.provider, chainId))
  }

  for (const channel of channels) {
    yield* fork(blockChannelWatcher, channel)
  }
}

function createBlockChannel(provider: providers.JsonRpcProvider, chainId: SupportedChainId) {
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

function* blockChannelWatcher(channel: EventChannel<BlockUpdate>) {
  while (true) {
    const block = yield* take(channel)
    // TODO validate block
    yield* put(updateLatestBlock({ chainId: block.chainId, latestBlockNumber: block.blockNumber }))
  }
}
