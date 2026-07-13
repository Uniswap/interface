import { JsonRpcProvider } from '@ethersproject/providers'
import {
  contentScriptToBackgroundMessageChannel,
  dappResponseMessageChannel,
} from 'src/background/messagePassing/messageChannels'
import { BaseMethodHandler } from 'src/contentScript/methodHandlers/BaseMethodHandler'
import { PendingResponseInfo } from 'src/contentScript/methodHandlers/types'
import { getPendingResponseInfo } from 'src/contentScript/methodHandlers/utils'
import { WindowEthereumRequest } from 'src/contentScript/types'
import { logContentScriptError } from 'src/contentScript/utils'
import { DappRequestType, DappResponseType } from 'uniswap/src/features/dappRequests/types'

/**
 * Handles read-only JSON-RPC requests (eth_call, eth_blockNumber, …) by relaying them to the
 * background service worker. The fetch runs there in an extension-privileged context, so it is
 * not bound by the dapp page's CORS — fixing reads on origins outside the gateway's allowlist
 * and keeping the wallet's authenticated RPC out of untrusted page context.
 */
export class ProviderDirectMethodHandler extends BaseMethodHandler<WindowEthereumRequest> {
  private readonly requestIdToSourceMap: Map<string, PendingResponseInfo> = new Map()

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

    dappResponseMessageChannel.addMessageListener(DappResponseType.ProviderDirectResponse, (message) => {
      const source = getPendingResponseInfo({
        requestIdToSourceMap: this.requestIdToSourceMap,
        requestId: message.requestId,
        type: DappResponseType.ProviderDirectResponse,
      })?.source

      if (message.error) {
        source?.postMessage({ requestId: message.requestId, error: message.error })
      } else {
        source?.postMessage({ requestId: message.requestId, result: message.result })
      }
    })
  }

  handleRequest(request: WindowEthereumRequest, source: MessageEventSource | null): void {
    const chainId = this.getChainId()
    if (!chainId) {
      // No active chain yet — surface a JSON-RPC-shaped error rather than hanging the dapp.
      source?.postMessage({
        requestId: request.requestId,
        error: { code: 4900, message: 'Provider is disconnected from all chains' },
      })
      return
    }

    this.requestIdToSourceMap.set(request.requestId, {
      type: DappResponseType.ProviderDirectResponse,
      source,
    })

    contentScriptToBackgroundMessageChannel
      .sendMessage({
        type: DappRequestType.ProviderDirect,
        requestId: request.requestId,
        chainId,
        method: request.method,
        params: Array.isArray(request.params) ? request.params : [],
      })
      .catch((error) => {
        this.requestIdToSourceMap.delete(request.requestId)
        logContentScriptError({
          errorMessage: error instanceof Error ? error.message : 'Failed to relay provider request',
          fileName: 'ProviderDirectMethodHandler.ts',
          functionName: 'handleRequest',
          extra: { method: request.method, dapp: window.origin },
        }).catch(() => {})
      })
  }
}
