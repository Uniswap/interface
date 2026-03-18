import { rpcErrors, serializeError } from '@metamask/rpc-errors'
import EventEmitter from 'eventemitter3'
import { addWindowMessageListener, removeWindowMessageListener } from 'src/background/messagePassing/messageUtils'
import { ExtensionResponse, isValidExtensionResponse } from 'src/contentScript/types'
import { BaseEthereumRequest, BaseEthereumRequestSchema } from 'src/contentScript/WindowEthereumRequestTypes'
import { logger } from 'utilities/src/logger/logger'
import { v4 as uuidv4 } from 'uuid'
import { ZodError } from 'zod'

type EthersSendCallback = (error: unknown, response: unknown) => void
type RequestInput = BaseEthereumRequest & { id?: number; jsonrpc?: string }

const messages = {
  errors: {
    disconnected: (): string => 'Uniswap Wallet: Disconnected from chain. Attempting to connect.',
    invalidRequestArgs: (): string => `Uniswap Wallet: Expected a single, non-array, object argument.`,
    invalidRequestGeneric: (): string => `Uniswap Wallet: Please check the input passed to the request method`,
  },
}

/**
 * Proxy class that is injected at `window.ethereum` to handle all RPC and extension API requests.
 * Passes along requests to the content script which then forwards and listens for requests accordingly.
 */
export class WindowEthereumProxy extends EventEmitter {
  /**
   * Boolean indicating that the provider is Uniswap Wallet.
   */
  isUniswapWallet = true

  /**
   * Boolean to spoof MetaMask
   * TODO(EXT-393): Remove this once more dapps support EIP-6963 or have explicit support for Uniswap Wallet.
   */
  isMetaMask: boolean

  /**
   * Pending requests are stored as promises that resolve or reject based on the response from the content script.
   */
  pendingRequests: {
    [key: string]: {
      resolve: (value: unknown) => void
      reject: (error: unknown) => void
    }
  }

  constructor() {
    super()

    this.isMetaMask = true
    this.pendingRequests = {}
  }

  // Deprecated EIP-11193 method
  enable = async (): Promise<unknown> => {
    return this.request({ method: 'eth_requestAccounts' })
  }

  // Deprecated EIP-1193 method
  send = (
    methodOrRequest: string | BaseEthereumRequest,
    paramsOrCallback: Array<unknown> | EthersSendCallback,
  ): Promise<unknown> | void => {
    if (typeof methodOrRequest === 'string' && typeof paramsOrCallback !== 'function') {
      return this.request({
        method: methodOrRequest,
        params: paramsOrCallback,
      })
    } else if (typeof methodOrRequest === 'object' && typeof paramsOrCallback === 'function') {
      return this.sendAsync(methodOrRequest, paramsOrCallback)
    }
    return Promise.reject(new Error('Unsupported function parameters'))
  }

  // Deprecated EIP-1193 method still in use by some DApps
  sendAsync = (
    request: RequestInput,
    callback: (error: unknown, response: unknown) => void,
  ): Promise<unknown> | void => {
    return this.request(request).then(
      (response) =>
        callback(null, {
          result: response,
          id: request.id,
          jsonrpc: request.jsonrpc,
        }),
      (error) => callback(error, null),
    )
  }

  request = async (args: RequestInput): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      try {
        const ethereumRequest = BaseEthereumRequestSchema.parse(args)

        // Generate a unique ID for this request and store the promise callbacks
        const requestId = uuidv4()
        this.pendingRequests[requestId] = { resolve, reject }
        const responseListener = addWindowMessageListener<ExtensionResponse>({
          validator: isValidExtensionResponse,
          handler: (response) => {
            if (response.requestId === requestId) {
              this.handleResponse(response)
              removeWindowMessageListener(responseListener)
            }
          },
        })
        window.postMessage({
          ...ethereumRequest,
          requestId,
        })
        return Promise.resolve()
      } catch (error) {
        logger.debug('WindowEthereumProxy.ts', 'request', 'Invalid request', args)

        // Based on the zod error, we can determine the type of error and reject accordingly
        if (error instanceof ZodError) {
          return reject(
            serializeError(
              rpcErrors.invalidRequest({
                message: messages.errors.invalidRequestArgs(),
                data: args,
              }),
            ),
          )
        }

        return reject(
          serializeError(
            rpcErrors.invalidRequest({
              message: messages.errors.invalidRequestGeneric(),
              data: args,
            }),
          ),
        )
      }
    })
  }

  private handleResponse(response: ExtensionResponse): boolean {
    const { requestId, result, error } = response
    const promise = this.pendingRequests[requestId]
    if (!promise) {
      logger.debug('WindowEthereumProxy.ts', 'handleResponse', 'No promise found for request id:', requestId)
      return false
    }

    if (error) {
      promise.reject(error)
      delete this.pendingRequests[requestId]
      return true
    }

    promise.resolve(result)

    // Clean up after handling the response
    delete this.pendingRequests[requestId]
    return true
  }
  // Utility function representing connectivity status for RPC requests to the current chain (as opposed to user accounts).
  // Method itself created by MetaMask and not in EIP spec. Necessary since some dapps supporting EIP-6963 require it.
  // TODO(EXT-1255): Currently faking real status, replace with actual implementation
  isConnected = (): boolean => true
}
