/* eslint-disable @typescript-eslint/no-explicit-any */

import { ethers, providers } from 'ethers'
import EventEmitter from 'eventemitter3'
import { ethErrors } from 'eth-rpc-errors'
import {
  ContentScriptRequest,
  ContentScriptResponse,
  RequestType,
  ResponseType,
  SendTransactionRequest,
  SendTransactionResponse,
  SignMessageRequest,
  SignMessageResponse,
  SignTransactionRequest,
  SignTransactionResponse,
} from '../types/messageTypes'
import { v4 as uuidv4 } from 'uuid'
import { logger } from 'app/src/features/logger/logger'

export type EthersSendCallback = (error: unknown, response: unknown) => void

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

// const originRequiresMetaMask = [
//   'opensea.io',
//   'matcha.xyz',
//   'kwenta.io',
//   'etherscan.io',
//   'uniswap.org',
// ]

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
  chainId: string

  /**
   * The user's currently selected Ethereum address.
   */
  publicKey: string | null

  /**
   *
   */
  public networkVersion?: string

  /**
   * Boolean indicating that the provider is Uniswap Wallet.
   */
  isUniswapWallet: boolean

  /**
   * Boolean for impersonating MetaMask.
   */
  isMetaMask: boolean

  /**
   * Ethereum JSON RPC provider.
   */
  provider: ethers.providers.JsonRpcProvider

  constructor() {
    super()

    this.setState({
      ...UniswapInjectedProvider._defaultState,
    })

    this.isUniswapWallet = true
    this.chainId = '0x5' // default to Goerli
    this.publicKey = null

    // const provider = new ethers.providers.JsonRpcProvider(
    //   'https://goerli.infura.io/v3/b14063d3418c40ec984f510cf64083b4'
    // )
    const provider = new providers.InfuraProvider(
      'goerli',
      'b14063d3418c40ec984f510cf64083b4'
    )

    this.provider = provider

    // Sometimes we want to pretend to be MetaMask
    this.isMetaMask = false
    this.handleConnect('0x5')
    // originRequiresMetaMask.some((h) =>
    //     window.location.host.includes(h)
    // );
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
      // eslint-disable-next-line radix
      net_version: () => `${parseInt(this.chainId)}`,
      eth_getBalance: (address: string) => this.provider.getBalance(address),
      eth_getCode: (address: string) => this.provider.getCode(address),
      eth_getStorageAt: (address: string, position: string) =>
        this.provider.getStorageAt(address, position),
      eth_getTransactionCount: (address: string) =>
        this.provider.getTransactionCount(address),
      eth_blockNumber: () => this.provider.getBlockNumber(),
      eth_getBlockByNumber: (block: number) => this.provider.getBlock(block),
      eth_call: (transaction: any) => this.provider.call(transaction),
      eth_estimateGas: (transaction: any) =>
        this.provider.estimateGas(transaction),
      eth_getTransactionByHash: (hash: string) =>
        this.provider.getTransaction(hash),
      eth_getTransactionReceipt: (hash: string) =>
        this.provider.getTransactionReceipt(hash),
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
      // wallet_addEthereumChain: (chain: any) =>
      //   this.handleWalletAddEthereumChain(chain),
      wallet_switchEthereumChain: (chainId: any) =>
        this.handleWalletSwitchEthereumChain(chainId),
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
   */
  handleConnect = async (chainId: string) => {
    this.chainId = chainId
    if (!this.state.isConnected) {
      this.setState({ ...this.state, isConnected: true })
    }
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect
    this.emit('connect', { chainId } as ProviderConnectInfo)
  }

  /**
   * Update local state and emit required event for chain change.
   */
  handleChainChanged = (chainId: string) => {
    this.chainId = chainId

    this.provider = new providers.InfuraProvider(
      chainId,
      'b14063d3418c40ec984f510cf64083b4'
    )

    logger.info('UniswapInjectedProvider', 'chain changed', chainId)

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
    if (this.isConnected()) {
      // Temporary hack until we have an actual connection request
      this.publicKey = '0x7e48f8a2CADA121853F75ECf1ca48447cd12E4c9'
      return [this.publicKey]
    } else {
      // TODO - Add code to send a request to get addresses from wallet
      return [this.publicKey]
    }
  }

  /**
   * Handle eth_sign, eth_signTypedData, personal_sign RPC requests.
   */
  handleEthSignMessage = async (messageHex: string) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SignMessageRequest = {
      type: RequestType.SignMessage,
      requestId: uuidv4(),
      messageHex: ethers.utils.toUtf8String(messageHex),
    }

    const response: SignMessageResponse = await sendRequestAndWaitForReponse(
      request,
      ResponseType.SignMessageResponse
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
      type: RequestType.SignTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }
    const response: SignTransactionResponse =
      await sendRequestAndWaitForReponse(
        request,
        ResponseType.SignTransactionResponse
      )
    return response.signedTransactionHash
  }

  /**
   * Handle eth_sendTransaction RPC requests.
   *
   * // TODO: Make sure these return types are correct because this is tricky
   * // TODO: Unit tests for provider injection methods
   * returns transaction hash
   */
  handleEthSendTransaction = async (transaction: unknown) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    const request: SendTransactionRequest = {
      type: RequestType.SendTransaction,
      requestId: uuidv4(),
      transaction: adaptTransactionForEthers(transaction),
    }

    // filter by some kind of ID on the transaction
    const response: SendTransactionResponse =
      await sendRequestAndWaitForReponse(
        request,
        ResponseType.SendTransactionResponse
      )
    return response?.transaction?.hash
  }

  handleWalletSwitchEthereumChain = async (chainId: string) => {
    if (!this.publicKey) {
      throw new Error('Wallet not connected')
    }

    this.handleChainChanged(chainId)
    return
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

function sendRequestAndWaitForReponse<T extends ContentScriptResponse>(
  request: ContentScriptRequest,
  responseType: T['type']
): Promise<T> {
  // TODO - add a unique ID to the message
  window.postMessage(request)
  return new Promise((resolve) => {
    window.addEventListener('message', (event: MessageEvent<any>) => {
      const messageData = event.data
      if (messageData?.type === responseType) {
        resolve(messageData)
      }

      //TODO  Add timeout here or logic for rejecting response
    })
  })
}
