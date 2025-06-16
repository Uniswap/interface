import { JsonRpcProvider } from '@ethersproject/providers'
import {
  contentScriptToBackgroundMessageChannel,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import {
  NexTradeOpenSidebarRequest,
  NexTradeOpenSidebarRequestSchema,
} from 'src/contentScript/WindowEthereumRequestTypes'
import { BaseMethodHandler } from 'src/contentScript/methodHandlers/BaseMethodHandler'
import { NexTradeMethods } from 'src/contentScript/methodHandlers/requestMethods'
import { PendingResponseInfo } from 'src/contentScript/methodHandlers/types'
import { getPendingResponseInfo } from 'src/contentScript/methodHandlers/utils'
import { WindowEthereumRequest } from 'src/contentScript/types'
import { DappRequestType, DappResponseType } from 'nextrade/src/features/dappRequests/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Handles all nextrade-specific requests
 */

export class NexTradeMethodHandler extends BaseMethodHandler<WindowEthereumRequest> {
  private readonly requestIdToSourceMap: Map<string, PendingResponseInfo> = new Map()

  constructor(
    getChainId: () => string | undefined,
    getProvider: () => JsonRpcProvider | undefined,
    getConnectedAddresses: () => Address[] | undefined,
    setChainIdAndMaybeEmit: (newChainId: string) => void,
    setProvider: (newProvider: JsonRpcProvider) => void,
    setConnectedAddressesAndMaybeEmit: (newConnectedAddresses: Address[]) => void,
  ) {
    super(
      getChainId,
      getProvider,
      getConnectedAddresses,
      setChainIdAndMaybeEmit,
      setProvider,
      setConnectedAddressesAndMaybeEmit,
    )

    dappResponseMessageChannel.addMessageListener(DappResponseType.NextTradeOpenSidebarResponse, (message) => {
      const source = getPendingResponseInfo(
        this.requestIdToSourceMap,
        message.requestId,
        DappResponseType.NextTradeOpenSidebarResponse,
      )?.source

      source?.postMessage({
        requestId: message.requestId,
      })
    })
  }

  async handleRequest(request: WindowEthereumRequest, source: MessageEventSource | null): Promise<void> {
    switch (request.method) {
      case NexTradeMethods.nextrade_openSidebar: {
        logger.debug("Handling 'nextrade_openSidebar' request", request.method, request.toString())
        const nexTradeOpenTokensRequest = NexTradeOpenSidebarRequestSchema.parse(request)
        await this.handleNexTradeOpenSidebarRequest(nexTradeOpenTokensRequest, source)
        break
      }
    }
  }

  private async handleNexTradeOpenSidebarRequest(
    request: NexTradeOpenSidebarRequest,
    source: MessageEventSource | null,
  ): Promise<void> {
    this.requestIdToSourceMap.set(request.requestId, {
      source,
      type: DappResponseType.NextTradeOpenSidebarResponse,
    })

    await contentScriptToBackgroundMessageChannel.sendMessage({
      type: DappRequestType.NextTradeOpenSidebar,
      requestId: request.requestId,
      tab: request.tab,
    })
  }
}
