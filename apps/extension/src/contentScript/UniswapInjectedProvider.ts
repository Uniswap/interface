/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChainId } from 'app/src/features/chains/chains'
import {
  AccountResponse,
  BaseDappRequest,
  BaseDappResponse,
  ChangeChainRequest,
  ChangeChainResponse,
  ConnectRequest,
  ConnectResponse,
  DappRequestType,
  DappResponseType,
  GetAccountRequest,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTransactionRequest,
  SignTransactionResponse,
  TransactionRejectedResponse,
} from 'app/src/features/dappRequests/dappRequestTypes'
import { logger } from 'app/src/features/logger/logger'
import { ethErrors } from 'eth-rpc-errors'
import { ethers } from 'ethers'
import EventEmitter from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'

export type EthersSendCallback = (error: unknown, response: unknown) => void
const TIMEOUT_MS = 30000

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#request
interface RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#rpc-errors
interface ProviderRpcError extends Error {
  code: number
  data?: unknown
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect-1
interface ProviderConnectInfo {
  readonly chainId: string
}

interface SwitchEthereumChainParameter {
  chainId: string
}

export interface JsonRpcRequest {
  jsonrpc: string
  method: string
  params: any[]
  id: number
}

export interface JsonRpcResponse {
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
    disconnected: () =>
      'Uniswap Wallet: Disconnected from chain. Attempting to connect.',
    invalidRequestArgs: () =>
      `Uniswap Wallet: Expected a single, non-array, object argument.`,
    invalidRequestMethod: () =>
      `Uniswap Wallet: 'args.method' must be a non-empty string.`,
    invalidRequestParams: () =>
      `Uniswap Wallet: 'args.params' must be an object or array if provided.`,
  },
}

export interface BaseProviderState {
  isConnected: boolean
}

export class UniswapInjectedProvider extends EventEmitter {
  state!: BaseProviderState

  protected static _defaultState: BaseProviderState = {
    isConnected: false,
  }

  /**
   * The chain ID of the currently connected Ethereum chain.
   */
  chainId?: string

  /**
   * The user's currently selected Ethereum address.
   */
  publicKey: string | null

  /**
   * Boolean indicating that the provider is Uniswap Wallet.
   */
  isUniswapWallet: boolean

  /**
   * Ethereum JSON RPC provider.
   */
  provider?: ethers.providers.JsonRpcProvider

  constructor() {
    super()

    this.setState({
      ...UniswapInjectedProvider._defaultState,
    })

    this.isUniswapWallet = true
    this.publicKey = null

    this.handleConnect(ChainId.Goerli.toString())
  }

  setState = (updatedState: BaseProviderState) => {
    this.state = updatedState
    Object.freeze(this.state)
  }

  //
  // Public methods
  //

  /**
   * Returns whether the provider can process RPC requests. (does not imply wallet is connected to dApp)
   */
  isConnected = (): boolean => {
    return this.state.isConnected
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
    if (
      typeof methodOrRequest === 'string' &&
      typeof paramsOrCallback !== 'function'
    ) {
      return this.request({
        method: methodOrRequest,
        params: paramsOrCallback,
      })
    } else if (
      typeof methodOrRequest === 'object' &&
      typeof paramsOrCallback === 'function'
    ) {
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
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestArgs(),
        data: args,
      })
    }

    const { method, params } = args

    if (typeof method !== 'string' || method.length === 0) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(),
        data: args,
      })
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestParams(),
        data: args,
      })
    }

    // type of map with string as key
    const functionMap: { [key: string]: any } = {
      eth_accounts: this.handleEthAccounts,
      eth_requestAccounts: this.handleEthRequestAccounts,
      eth_chainId: () => this.chainId,
      net_version: () =>
        // eslint-disable-next-line radix
        this.chainId ? `${parseInt(this.chainId)}` : undefined,
      eth_getBalance: (address: string) => this.provider?.getBalance(address),
      eth_getCode: (address: string) => this.provider?.getCode(address),
      eth_getStorageAt: (address: string, position: string) =>
        this.provider?.getStorageAt(address, position),
      eth_getTransactionCount: (address: string) =>
        this.provider?.getTransactionCount(address),
      eth_blockNumber: () => this.provider?.getBlockNumber(),
      eth_getBlockByNumber: (block: number) => this.provider?.getBlock(block),
      eth_call: (transaction: any) => this.provider?.call(transaction),
      eth_estimateGas: (transaction: any) =>
        this.provider?.estimateGas(transaction),
      eth_getTransactionByHash: (hash: string) =>
        this.provider?.getTransaction(hash),
      eth_getTransactionReceipt: (hash: string) =>
        this.provider?.getTransactionReceipt(hash),
      eth_sign: (_address: string, _message: string) => {
        // Backpack mentioned this is a significant security risk because it can be used to
        // sign transactions.
        // TODO maybe enable this with a large warning in the UI?
        throw new Error(
          'Uniswap Wallet does not support eth_sign due to security concerns'
        )
      },
      personal_sign: (messageHex: string, _address: string) =>
        this.handleEthSignMessage(messageHex),
      eth_signTransaction: (transaction: any) =>
        this.handleEthSignTransaction(transaction),
      eth_sendTransaction: (transaction: any) =>
        this.handleEthSendTransaction(transaction),
      wallet_switchEthereumChain: (
        switchRequest: SwitchEthereumChainParameter
      ) => this.handleWalletSwitchEthereumChain(switchRequest),
    }

    const func = functionMap[method]
    if (func === undefined) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(),
        data: args,
      })
    }

    // eslint-disable-next-line no-async-promise-executor
    return new Promise<JsonRpcResponse>(async (resolve, reject) => {
      let rpcResult
      try {
        rpcResult = await func(...(<[]>(params ? params : [])))
      } catch (error) {
        logger.error(
          'UniswapInjectedProvider',
          'rpc response error',
          `${error}`
        )
        return reject(error)
      }
      return resolve(rpcResult)
    })
  }

  /**
   * Update local state and emit required event for connect.
   * Not used by Uniswap dApp
   * https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect
   */
  handleConnect = async (chainId: string) => {
    this.chainId = chainId
    if (!this.state.isConnected) {
      try {
        const handleConnectRequest: ConnectRequest = {
          type: DappRequestType.Connect,
          requestId: uuidv4(),
          chainId,
        }
        const { providerUrl } = await sendRequestAsync<ConnectResponse>(
          handleConnectRequest,
          DappResponseType.ConnectResponse
        )

        this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
        this.setState({ ...this.state, isConnected: true })
      } catch (error) {
        throw new Error('Failed to connect to wallet')
      }
    }
    this.emit('connect', { chainId } as ProviderConnectInfo)
  }

  /**
   * Update local state and emit required event for chain change.
   */
  handleChainChanged = async (chainId: string) => {
    const changeChainRequest: ChangeChainRequest = {
      type: DappRequestType.ChangeChain,
      requestId: uuidv4(),
      chainId,
    }

    const { chainId: newChainId, providerUrl } =
      await sendRequestAsync<ChangeChainResponse>(
        changeChainRequest,
        DappResponseType.ChainChangeResponse
      )

    this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
    this.chainId = newChainId
    logger.info('UniswapInjectedProvider', 'chain changed', newChainId)

    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#chainchanged
    this.emit('chainChanged', chainId)
  }

  /**
   * Emit the required event for a change of accounts.
   */
  handleAccountsChanged = async (accounts: unknown[]) => {
    this.emit('accountsChanged', accounts)
  }

  /**
   * Handle eth_accounts requests
   */
  handleEthAccounts = async () => {
    if (this.isConnected() && this.publicKey) {
      return [this.publicKey]
    }
    return []
  }

  /**
   * Handle eth_requestAccounts requests
   */
  handleEthRequestAccounts = async () => {
    // Send request to the RPC API.
    if (!this.publicKey) {
      const getAccountRequest: GetAccountRequest = {
        type: DappRequestType.GetAccount,
        requestId: uuidv4(),
      }
      const { accountAddress } = await sendRequestAsync<AccountResponse>(
        getAccountRequest,
        DappResponseType.AccountResponse
      )
      this.publicKey = accountAddress

      // TODO: Remove this once we have a better way to handle the connection state.
      this.setState({ ...this.state, isConnected: true })
    }
    return [this.publicKey]
  }

  /**
   * Handle eth_sign, eth_signTypedData, personal_sign RPC requests.
   */
  handleEthSignMessage = async (messageHex: string) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SignMessageRequest = {
      type: DappRequestType.SignMessage,
      requestId: uuidv4(),
      messageHex: ethers.utils.toUtf8String(messageHex),
    }

    const response: SignMessageResponse = await sendRequestAsync(
      request,
      DappResponseType.SignMessageResponse
    )
    return response?.signedMessage
  }

  /**
   * Handle eth_signTransaction RPC requests.
   */
  handleEthSignTransaction = async (transaction: unknown) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SignTransactionRequest = {
      type: DappRequestType.SignTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }
    const response: SignTransactionResponse = await sendRequestAsync(
      request,
      DappResponseType.SignTransactionResponse
    )
    return response.signedTransactionHash
  }

  /**
   * Handle eth_sendTransaction RPC requests.
   *
   * // TODO: Unit tests for provider injection methods
   * @returns transaction hash
   */
  handleEthSendTransaction = async (transaction: unknown) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SendTransactionRequest = {
      type: DappRequestType.SendTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }

    // filter by some kind of ID on the transaction
    const response = await sendRequestAsync<
      SendTransactionResponse | TransactionRejectedResponse
    >(request, DappResponseType.SendTransactionResponse)

    if (response.type === DappResponseType.TransactionRejected) {
      throw new Error('Transaction rejected')
    }
    return response?.transaction?.hash
  }

  handleWalletSwitchEthereumChain = async (
    switchRequest: SwitchEthereumChainParameter
  ) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const changeChainRequest: ChangeChainRequest = {
      type: DappRequestType.ChangeChain,
      requestId: uuidv4(),
      chainId: switchRequest.chainId,
    }

    const { providerUrl } = await sendRequestAsync<ChangeChainResponse>(
      changeChainRequest,
      DappResponseType.ChainChangeResponse
    )

    this.provider = new ethers.providers.JsonRpcProvider(providerUrl)
    this.chainId = switchRequest.chainId
    return null
  }
  /**
   * Handle a disconnection notification from Uniswap Extension.
   */
  _handleDisconnected = async () => {
    if (this.isConnected()) {
      // Reset public state
      this.publicKey = null
      // Reset private state

      this.setState({
        ...UniswapInjectedProvider._defaultState,
      })
    }
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#disconnect
    this.emit('disconnect', {
      code: 4900,
      message: 'User disconnected',
    } as ProviderRpcError)
  }
}

/**
 * Adapt a transaction object to be compatible with ethers.js
 */
function adaptTransactionForEthers(transaction: any) {
  transaction.gasLimit = transaction.gas
  delete transaction.gas
  return transaction
}

/**
 *
 * @param request ContentScriptRequest sent to background service-worker
 * @param responseType type of ContentScriptResponse (can include TransactionRejected)
 * @returns
 */
function sendRequestAsync<T extends BaseDappResponse>(
  request: BaseDappRequest,
  responseType: T['type']
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handleDappRequest)
      reject('Request timed out')
    }, TIMEOUT_MS)

    const handleDappRequest = (event: MessageEvent<any>) => {
      const messageData = event.data
      if (
        (messageData?.type === responseType ||
          messageData?.type === DappResponseType.TransactionRejected) &&
        messageData?.requestId === request.requestId
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
