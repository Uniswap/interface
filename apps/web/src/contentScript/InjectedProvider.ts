/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { errorCodes, ethErrors } from 'eth-rpc-errors'
import { ethers } from 'ethers'
import EventEmitter from 'eventemitter3'
import {
  AccountResponse,
  BaseDappRequest,
  BaseDappResponse,
  ChangeChainRequest,
  ChangeChainResponse,
  DappRequestType,
  DappResponseType,
  ErrorResponse,
  GetAccountRequest,
  isErrorResponse,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  SignTypedDataRequest,
  SignTypedDataResponse,
} from 'src/background/features/dappRequests/dappRequestTypes'
import { isValidMessage } from 'src/background/utils/messageUtils'
import {
  BaseExtensionRequest,
  ExtensionChainChange,
  ExtensionToDappRequestType,
  UpdateConnectionRequest,
} from 'src/types/requests'
import { logger } from 'utilities/src/logger/logger'
import { ONE_HOUR_MS } from 'utilities/src/time/time'
import { v4 as uuidv4 } from 'uuid'
import { ChainId } from 'wallet/src/constants/chains'
import { chainIdToHexadecimalString, toSupportedChainId } from 'wallet/src/features/chains/utils'

type EthersSendCallback = (error: unknown, response: unknown) => void

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#request
interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect-1
interface ProviderConnectInfo {
  readonly chainId: string
}

interface SwitchEthereumChainParameter {
  chainId: string
}

interface JsonRpcResponse {
  jsonrpc: string
  id: number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

const messages = {
  errors: {
    disconnected: (): string => 'Uniswap Wallet: Disconnected from chain. Attempting to connect.',
    invalidRequestArgs: (): string =>
      `Uniswap Wallet: Expected a single, non-array, object argument.`,
    invalidRequestMethod: (): string => `Uniswap Wallet: 'args.method' must be a non-empty string.`,
    invalidRequestParams: (): string =>
      `Uniswap Wallet: 'args.params' must be an object or array if provided.`,
  },
}

export class InjectedProvider extends EventEmitter {
  /**
   * The chain ID of the currently connected Ethereum chain.
   */
  private chainId?: ChainId

  /**
   * The user's currently connected Ethereum addresses.
   */
  private publicKeys: Address[] | null

  /**
   * Ethereum JSON RPC provider.
   */
  private provider?: ethers.providers.JsonRpcProvider

  /**
   * Boolean indicating that the provider is Uniswap Wallet.
   */
  isUniswapWallet: boolean

  /**
   * Boolean to spoof MetaMask
   */
  isMetaMask: boolean

  _isConnected: boolean

  constructor() {
    super()

    this._isConnected = true
    this.isMetaMask = true
    this.isUniswapWallet = true
    this.publicKeys = null

    this.initExtensionToDappOneWayListener()
  }

  /**
   * Initialize a listener for messages posted from the Uniswap Wallet extension.
   */
  private initExtensionToDappOneWayListener = (): void => {
    const handleDappRequest = async (event: MessageEvent<BaseExtensionRequest>): Promise<void> => {
      const messageData = event.data
      switch (messageData?.type) {
        case ExtensionToDappRequestType.SwitchChain: {
          const request = messageData as ExtensionChainChange
          this.chainId = request.chainId
          this.provider = new ethers.providers.JsonRpcProvider(request.providerUrl)
          this.emit('chainChanged', chainIdToHexadecimalString(this.chainId))
          break
        }
        case ExtensionToDappRequestType.UpdateConnections: {
          const request = messageData as UpdateConnectionRequest
          await this.handleUpdatedConnections(request.addresses)
        }
      }
    }

    // This listener isn't removed because it's needed for the lifetime of the app
    // TODO: Check for active tab when listening to events
    window.addEventListener('message', handleDappRequest)
  }

  //
  // Public methods
  //

  isAuthorized = (): boolean => {
    return !!this.publicKeys?.length
  }

  /**
   * Returns whether the provider can process RPC requests. (does not imply wallet is connected to dApp)
   * Returns true if the provider is connected to the current chain. If the provider isn't connected,
   * the page must be reloaded to re-establish the connection.
   */
  isConnected = (): boolean => {
    return this._isConnected
  }

  // Deprecated EIP-1193 method
  enable = async (): Promise<unknown> => {
    return this.request({ method: 'eth_requestAccounts' })
  }

  // Deprecated EIP-1193 method
  send = (
    methodOrRequest: string | RequestArguments,
    paramsOrCallback: Array<unknown> | EthersSendCallback
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
    request: RequestArguments & { id?: number; jsonrpc?: string },
    callback: (error: unknown, response: unknown) => void
  ): Promise<unknown> | void => {
    return this.request(request).then(
      (response) =>
        callback(null, {
          result: response,
          id: request.id,
          jsonrpc: request.jsonrpc,
        }),
      (error) => callback(error, null)
    )
  }

  request = async (args: RequestArguments): Promise<JsonRpcResponse> => {
    return new Promise<JsonRpcResponse>((resolve, reject) => {
      if (!this.isConnected()) {
        return reject(ethErrors.provider.disconnected())
      }

      if (!args || typeof args !== 'object' || Array.isArray(args)) {
        return reject(
          ethErrors.rpc.invalidRequest({
            message: messages.errors.invalidRequestArgs(),
            data: args,
          })
        )
      }

      const { method, params } = args
      if (typeof method !== 'string' || method.length === 0) {
        return reject(
          ethErrors.rpc.invalidRequest({
            message: messages.errors.invalidRequestMethod(),
            data: args,
          })
        )
      }

      if (
        params !== undefined &&
        !Array.isArray(params) &&
        (typeof params !== 'object' || params === null)
      ) {
        return reject(
          ethErrors.rpc.invalidRequest({
            message: messages.errors.invalidRequestParams(),
            data: args,
          })
        )
      }

      const func = this.functionMap[method]
      if (func === undefined) {
        return reject(
          ethErrors.provider.unsupportedMethod({
            message: messages.errors.invalidRequestMethod(),
            data: args,
          })
        )
      }

      Promise.resolve(func(...(<[]>(params ? params : []))))
        .then((result) => {
          if (isErrorResponse(result)) {
            if (result.error.code === errorCodes.provider.disconnected) {
              this._isConnected = false
            }

            reject(result.error)
          } else {
            resolve(result)
          }
        })
        .catch((error) => {
          logger.error(error, { tags: { file: 'InjectedProvider', function: 'request' } })
        })
    })
  }

  /** Returns the ChainId in a hex string which is what dapps expect. */
  private handleEthChainId = (): string | undefined => {
    return this.chainId ? chainIdToHexadecimalString(this.chainId) : undefined
  }

  /**
   * Handle eth_accounts requests. This is called when a dapp first loads.
   * If the user has already connected then this will automatically reconnect them.
   */
  private handleEthAccounts = async (): Promise<string[] | ErrorResponse> => {
    // Send request to the RPC API.
    if (this.publicKeys) {
      return this.publicKeys
    }

    const getAccountRequest: GetAccountRequest = {
      type: DappRequestType.GetAccount,
      requestId: uuidv4(),
    }
    return this._handleEthAccounts(getAccountRequest)
  }

  /**
   * Handle eth_requestAccounts requests.
   * The same as handleEthAccounts but it requires user approval for the first connection.
   */
  private handleEthRequestAccounts = async (): Promise<string[] | ErrorResponse> => {
    // Send request to the RPC API.
    if (this.publicKeys?.length) {
      return this.publicKeys
    }

    const getAccountRequest: GetAccountRequest = {
      type: DappRequestType.GetAccountRequest,
      requestId: uuidv4(),
    }
    return this._handleEthAccounts(getAccountRequest)
  }

  private _handleEthAccounts = async (
    request: GetAccountRequest
  ): Promise<string[] | ErrorResponse> => {
    // Send request to the RPC API.
    const response = await sendRequestAsync<AccountResponse>(
      request,
      DappResponseType.AccountResponse
    )

    if (isErrorResponse(response)) {
      return response
    }

    const { connectedAddresses, chainId, providerUrl } = response
    this.publicKeys = connectedAddresses
    this.chainId = chainId
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl)

    this.emit('connect', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chainId: chainIdToHexadecimalString(this.chainId!),
    } as ProviderConnectInfo)
    this.emit('accountsChanged', this.publicKeys)

    return this.publicKeys
  }

  /**
   * Handle eth_sign, eth_signTypedData, personal_sign RPC requests.
   */
  private handleEthSignMessage = async (
    messageHex: string
  ): Promise<string | undefined | ErrorResponse> => {
    if (!this.isAuthorized()) {
      return { error: ethErrors.provider.unauthorized() } as ErrorResponse
    }

    const request: SignMessageRequest = {
      type: DappRequestType.SignMessage,
      requestId: uuidv4(),
      messageHex: ethers.utils.toUtf8String(messageHex),
    }

    const response = await sendRequestAsync<SignMessageResponse>(
      request,
      DappResponseType.SignMessageResponse
    )

    return isErrorResponse(response) ? response : response?.signature
  }

  /**
   * Handle eth_signTransaction RPC requests.
   */
  private handleEthSignTransaction = async (
    transaction: unknown
  ): Promise<string | undefined | ErrorResponse> => {
    if (!this.isAuthorized()) {
      return { error: ethErrors.provider.unauthorized() } as ErrorResponse
    }

    const request: SignTransactionRequest = {
      type: DappRequestType.SignTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }
    const response = await sendRequestAsync<SignTransactionResponse>(
      request,
      DappResponseType.SignTransactionResponse
    )

    return isErrorResponse(response) ? response : response.signedTransactionHash
  }

  /**
   * Handle eth_sendTransaction RPC requests.
   *
   * // TODO: Unit tests for provider injection methods
   * @returns transaction hash
   */
  private handleEthSendTransaction = async (
    transaction: unknown
  ): Promise<string | undefined | ErrorResponse> => {
    if (!this.isAuthorized()) {
      return { error: ethErrors.provider.unauthorized() } as ErrorResponse
    }

    const request: SendTransactionRequest = {
      type: DappRequestType.SendTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }

    const response = await sendRequestAsync<SendTransactionResponse>(
      request,
      DappResponseType.SendTransactionResponse
    )

    return isErrorResponse(response) ? response : response?.transaction?.hash
  }

  private handleWalletSwitchEthereumChain = async (
    switchRequest: SwitchEthereumChainParameter
  ): Promise<null | ErrorResponse> => {
    if (!this.isAuthorized()) {
      return { error: ethErrors.provider.unauthorized() } as ErrorResponse
    }

    const chainId = toSupportedChainId(parseInt(switchRequest.chainId, 16))
    if (!chainId) {
      // TODO(EXT-330): we should support switching to any chain
      return {
        error: ethErrors.provider.custom({
          code: 4902,
          message: 'Uniswap Wallet does not support switching to this chain.',
        }),
      } as ErrorResponse
    }

    const changeChainRequest: ChangeChainRequest = {
      type: DappRequestType.ChangeChain,
      requestId: uuidv4(),
      chainId,
    }

    const response = await sendRequestAsync<ChangeChainResponse>(
      changeChainRequest,
      DappResponseType.ChainChangeResponse
    )

    if (isErrorResponse(response)) {
      return response
    }

    this.provider = new ethers.providers.JsonRpcProvider(response.providerUrl)
    this.chainId = chainId
    return null
  }

  /**
   * Signed typed data using eth_signTypedData_v4
   *
   * @param address address to sign typed data with
   * @param typedData typed data to sign
   * @returns
   */
  private handleEthSignTypedData = async (
    _address: any,
    typedData: any
  ): Promise<string | ErrorResponse> => {
    if (!this.isAuthorized()) {
      return { error: ethErrors.provider.unauthorized() } as ErrorResponse
    }

    const request: SignTypedDataRequest = {
      type: DappRequestType.SignTypedData,
      requestId: uuidv4(),
      typedData,
    }

    const response = await sendRequestAsync<SignTypedDataResponse>(
      request,
      DappResponseType.SignTypedDataResponse
    )

    return isErrorResponse(response) ? response : response.signature
  }

  private handleUpdatedConnections = async (addresses: Address[]): Promise<void> => {
    this.publicKeys = addresses
    this.emit('accountsChanged', this.publicKeys)
  }

  // type of map with string as key
  private functionMap: { [key: string]: (...params: any[]) => Promise<any> | any } = {
    eth_accounts: this.handleEthAccounts,
    eth_requestAccounts: this.handleEthRequestAccounts,
    eth_chainId: () => this.handleEthChainId(),
    net_version: () => this.handleEthChainId(),
    eth_getBalance: (address: string) => this.provider?.getBalance(address),
    eth_getCode: (address: string) => this.provider?.getCode(address),
    eth_getStorageAt: (address: string, position: string) =>
      this.provider?.getStorageAt(address, position),
    eth_getTransactionCount: (address: string) => this.provider?.getTransactionCount(address),
    eth_blockNumber: () => this.provider?.getBlockNumber(),
    eth_getBlockByNumber: (block: number) => this.provider?.getBlock(block),
    eth_call: (transaction: any) => this.provider?.call(transaction),
    eth_gasPrice: () => this.provider?.getGasPrice(),
    eth_estimateGas: (transaction: any) => this.provider?.estimateGas(transaction),
    eth_getTransactionByHash: (hash: string) => this.provider?.getTransaction(hash),
    eth_getTransactionReceipt: (hash: string) => this.provider?.getTransactionReceipt(hash),
    eth_sign: (_address: string, _message: string) => {
      // Backpack mentioned this is a significant security risk because it can be used to
      // sign transactions.
      // TODO maybe enable this with a large warning in the UI?
      return {
        error: ethErrors.provider.unsupportedMethod({
          message: 'Uniswap Wallet does not support eth_sign due to security concerns',
        }),
      }
    },
    personal_sign: (messageHex: string, _address: string) => this.handleEthSignMessage(messageHex),
    eth_signTransaction: (transaction: any) => this.handleEthSignTransaction(transaction),
    eth_sendTransaction: (transaction: any) => this.handleEthSendTransaction(transaction),
    wallet_switchEthereumChain: (switchRequest: SwitchEthereumChainParameter) =>
      this.handleWalletSwitchEthereumChain(switchRequest),
    eth_signTypedData_v4: (address: string, typedData: any) =>
      this.handleEthSignTypedData(address, typedData),
  }
}

/**
 * Adapt a transaction object to be compatible with ethers.js
 */
function adaptTransactionForEthers(transaction: any): any {
  transaction.gasLimit = transaction.gas
  delete transaction.gas
  return transaction
}

/**
 *
 * @param request ContentScriptRequest sent to background service-worker
 * @param responseType type of ContentScriptResponse (can include TransactionRejected)
 * @returns the specific response type or ErrorResponse if the user rejects the request
 */
function sendRequestAsync<T extends BaseDappResponse>(
  request: BaseDappRequest,
  responseType: T['type'],
  timeoutMs = ONE_HOUR_MS
): Promise<T | ErrorResponse> {
  return new Promise((resolve, reject) => {
    // TOOD(EXT-276): improve transaction timeout logic
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleDappRequest)
      reject('Request timed out')
    }, timeoutMs)

    const handleDappRequest = (event: MessageEvent<any>): void => {
      const messageData = event.data
      if (
        messageData?.requestId === request.requestId &&
        isValidMessage<T | ErrorResponse>(
          [responseType, DappResponseType.ErrorResponse],
          messageData
        )
      ) {
        resolve(messageData)

        // need to remove just this specific window listener
        window.removeEventListener('message', handleDappRequest)
        clearTimeout(timeout)
      }
    }

    window.addEventListener('message', handleDappRequest)
    window.postMessage(request)
  })
}
