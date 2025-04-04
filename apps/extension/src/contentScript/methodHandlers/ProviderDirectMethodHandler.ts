import { JsonRpcProvider } from '@ethersproject/providers'
import { BigNumber } from 'ethers'
import { BaseMethodHandler } from 'src/contentScript/methodHandlers/BaseMethodHandler'
import { ProviderDirectMethods } from 'src/contentScript/methodHandlers/requestMethods'
import { WindowEthereumRequest } from 'src/contentScript/types'
import { logger } from 'utilities/src/logger/logger'

/**
 * Handles all provider direct requests
 * Maps Ethereum JSON-RPC methods to their corresponding ethers.js provider method calls.
 */

export class ProviderDirectMethodHandler extends BaseMethodHandler<WindowEthereumRequest> {
  private methodHandlers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: (provider: JsonRpcProvider, params: any[]) => Promise<any>
  }

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

    this.methodHandlers = {
      /* eslint-disable @typescript-eslint/explicit-function-return-type */
      [ProviderDirectMethods.eth_getBalance]: (provider, params) => provider.getBalance(params[0]),
      [ProviderDirectMethods.eth_getCode]: (provider, params) => provider.getCode(params[0]),
      [ProviderDirectMethods.eth_getStorageAt]: (provider, params) => provider.getStorageAt(params[0], params[1]),
      [ProviderDirectMethods.eth_getTransactionCount]: (provider, params) => provider.getTransactionCount(params[0]),
      [ProviderDirectMethods.eth_blockNumber]: (provider, _params) => provider.getBlockNumber(),
      [ProviderDirectMethods.eth_getBlockByNumber]: (provider, params) => provider.getBlock(params[0]),
      [ProviderDirectMethods.eth_call]: (provider, params) => provider.call(params[0]),
      [ProviderDirectMethods.eth_gasPrice]: (provider, _params) => provider.getGasPrice(),
      [ProviderDirectMethods.eth_estimateGas]: (provider, params) => provider.estimateGas(params[0]),
      [ProviderDirectMethods.eth_getTransactionByHash]: (provider, params) => provider.getTransaction(params[0]),
      [ProviderDirectMethods.eth_getTransactionReceipt]: (provider, params) =>
        provider.getTransactionReceipt(params[0]),
      [ProviderDirectMethods.net_version]: async (provider, params) => provider.send('net_version', params),
      [ProviderDirectMethods.web3_clientVersion]: async (provider, params) =>
        provider.send('web3_clientVersion', params),
    }
  }

  handleRequest(request: WindowEthereumRequest, source: MessageEventSource | null): void {
    const handler = this.methodHandlers[request.method]
    if (handler) {
      const provider = this.getProvider()
      if (!provider) {
        // TODO: Handle error for disconnection
        return
      }
      const response = handler(provider, request.params)
      this.handleResponse(response, source, request.requestId)
    } else {
      // We shouldn't end up here because injected.ts checks that the method is supported before calling this function
      logger.error(new Error('Unexpected method requested'), {
        tags: {
          file: 'ProviderDirectMethodHandler.ts',
          function: 'handleRequest',
        },
        extra: {
          method: request.method,
          dapp: window.origin,
        },
      })
    }
  }

  private handleResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: Promise<any>,
    source: MessageEventSource | null,
    requestId: string,
  ): void {
    response
      .then((result) => {
        source?.postMessage({
          requestId,
          result: JSON.parse(
            JSON.stringify(result, (_key, value) => {
              if (!value) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return value
              } else if (BigNumber.isBigNumber(value)) {
                return value.toHexString()
              } else if (value.type === 'BigNumber' && value.hex) {
                // Unsure of why but sometimes the provider has converted the BigNumber with BigNumber.toJSON() e.g. eth_getBlockByNumber
                // which is a format not currently accepted by some dapps e.g. Morpho
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return value.hex
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return value
            }),
          ),
        })
      })
      .catch((error) => {
        source?.postMessage({
          requestId,
          error,
        })
      })
  }
}
