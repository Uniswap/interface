import { JsonRpcProvider } from '@ethersproject/providers'
import {
  contentScriptToBackgroundMessageChannel,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import { BaseMethodHandler } from 'src/contentScript/methodHandlers/BaseMethodHandler'
import { UniswapMethods } from 'src/contentScript/methodHandlers/requestMethods'
import { PendingResponseInfo } from 'src/contentScript/methodHandlers/types'
import { getPendingResponseInfo } from 'src/contentScript/methodHandlers/utils'
import { WindowEthereumRequest } from 'src/contentScript/types'
import {
  UniswapOpenSidebarRequest,
  UniswapOpenSidebarRequestSchema,
} from 'src/contentScript/WindowEthereumRequestTypes'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Handles all uniswap-specific requests
 */

export class UniswapMethodHandler extends BaseMethodHandler<WindowEthereumRequest> {
  private readonly requestIdToSourceMap: Map<string, PendingResponseInfo> = new Map()

  // eslint-disable-next-line max-params
  constructor({
    getChainId,
    getProvider,
    getConnectedAddresses,
    setChainIdAndMaybeEmit,
    setProvider,
    setConnectedAddressesAndMaybeEmit,
  }: {
    getChainId: () => string | undefined
    getProvider: () => JsonRpcProvider | undefined
    getConnectedAddresses: () => Address[] | undefined
    setChainIdAndMaybeEmit: (newChainId: string) => void
    setProvider: (newProvider: JsonRpcProvider) => void
    setConnectedAddressesAndMaybeEmit: (newConnectedAddresses: Address[]) => void
  }) {
    super(
      getChainId,
      getProvider,
      getConnectedAddresses,
      setChainIdAndMaybeEmit,
      setProvider,
      setConnectedAddressesAndMaybeEmit,
    )

    dappResponseMessageChannel.addMessageListener(DappResponseType.UniswapOpenSidebarResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.UniswapOpenSidebarResponse,
      })?.source

      source?.postMessage({
        requestId: message.requestId,
      })
    })
  }

  async handleRequest(request: WindowEthereumRequest, source: MessageEventSource | null): Promise<void> {
    switch (request.method) {
      case UniswapMethods.uniswap_openSidebar: {
        logger.debug("Handling 'uniswap_openSidebar' request", request.method, request.toString())
        const uniswapOpenTokensRequest = UniswapOpenSidebarRequestSchema.parse(request)
        await this.handleUniswapOpenSidebarRequest(uniswapOpenTokensRequest, source)
        break
      }
    }
  }

  private async handleUniswapOpenSidebarRequest(
    request: UniswapOpenSidebarRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      source,
      type: DappResponseType.UniswapOpenSidebarResponse,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.UniswapOpenSidebar,
      requestId: request.requestId,
      tab: request.tab,
    })
  }
}
