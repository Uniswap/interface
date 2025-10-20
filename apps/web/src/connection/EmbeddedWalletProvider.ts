import { getEmbeddedWalletState, setChainId } from 'state/embeddedWallet/store'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  signMessagesWithPasskey,
  signTransactionsWithPasskey,
  signTypedDataWithPasskey,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { HexString, isValidHexString } from 'utilities/src/addresses/hex'
import { logger } from 'utilities/src/logger/logger'
import { Account, createPublicClient, fallback, Hash, http, SignableMessage } from 'viem'

export type Listener = (payload: any) => void

type RequestArgs = {
  method: string
  params?: any[]
}

// JSON.stringify does not handle BigInts, so we need to convert them to strings
const safeJSONStringify = (param: any): any => {
  return JSON.stringify(
    param,
    (_, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
  )
}

const NoWalletFoundError = new Error('Attempted embedded wallet function with no embedded wallet connected')

export class EmbeddedWalletProvider {
  listeners: Map<string, Set<Listener>>
  chainId: UniverseChainId
  publicClient?: ReturnType<typeof createPublicClient>
  static _instance: EmbeddedWalletProvider | undefined

  private constructor() {
    this.listeners = new Map()
    const { chainId } = getEmbeddedWalletState()
    this.chainId = chainId ?? 1
    this.publicClient = undefined
  }

  public static getInstance(): EmbeddedWalletProvider {
    if (!this._instance) {
      this._instance = new EmbeddedWalletProvider()
    }
    return this._instance
  }

  private getPublicClient(chainId: UniverseChainId) {
    if (!this.publicClient || this.publicClient.chain !== getChainInfo(chainId)) {
      const chainInfo = getChainInfo(this.chainId)
      const rpcUrls = chainInfo.rpcUrls
      const fallbackTransports = rpcUrls.fallback?.http.map((url) => http(url)) ?? []
      this.publicClient = createPublicClient({
        chain: chainInfo,
        transport: fallback([
          http(rpcUrls.public?.http[0]), // generally quicknode
          http(rpcUrls.default.http[0]), // options here and below are usually public endpoints
          ...fallbackTransports,
        ]),
      })
    }
    return this.publicClient
  }

  async request(args: RequestArgs) {
    switch (args.method) {
      case 'eth_call':
        return this.call(args.params)
      case 'eth_estimateGas':
        return this.estimateGas(args.params)
      case 'eth_accounts':
        return this.getAccounts()
      case 'eth_sendTransaction':
        return this.sendTransaction(args.params)
      case 'eth_chainId':
        return this.getChainId()
      case 'eth_getTransactionByHash':
        return this.getTransactionByHash(args.params?.[0])
      case 'eth_getTransactionReceipt':
        return this.getTransactionReceipt(args.params?.[0])
      case 'wallet_switchEthereumChain':
        return this.updateChainId(args.params?.[0].chainId)
      case 'eth_blockNumber':
        return this.getBlockNumber()
      case 'personal_sign':
        return this.signMessage(args)
      case 'eth_sign':
        return this.sign(args)
      case 'eth_signTypedData_v4':
        return this.signTypedData(args)
      case 'eth_getBlockByNumber':
        return this.getBlockNumber()
      case 'eth_getCode':
        return this.getCode(args)
      default: {
        logger.error(NoWalletFoundError, {
          tags: { file: 'EmbeddedWalletProvider.ts', function: 'request' },
        })
        throw NoWalletFoundError
      }
    }
  }

  on(event: string, listener: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  removeListener(event: string, listener: Listener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener)
    }
  }

  off(event: string, listener: Listener) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener)
    }
  }

  emit(event: string, payload: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((listener) => listener(payload))
    }
  }

  connect(chainId?: number) {
    this.chainId = chainId ?? 1 // TODO[EW]: handle base case and dynamic switching
    setChainId(chainId ?? null)
    this.emit('connect', { chainId: this.chainId })
  }

  disconnect(error: any) {
    this.emit('disconnect', error)
  }

  getAccount() {
    const { walletAddress } = getEmbeddedWalletState()
    const address =
      (getValidAddress({
        address: walletAddress,
        platform: Platform.EVM,
        withEVMChecksum: true,
      }) as Nullable<HexString>) || undefined

    if (!address) {
      logger.debug('EmbeddedWalletProvider.ts', 'getAccount', 'No embedded wallet connected')
      return undefined
    }

    const signMessage = async ({ message }: { message: SignableMessage }): Promise<HexString> => {
      try {
        const signedMessages = await signMessagesWithPasskey([message.toString()], address)
        const signedMessage = signedMessages?.[0]
        if (!signedMessage || !isValidHexString(signedMessage)) {
          throw new Error(`Invalid signed message: ${signedMessage}`)
        }
        return signedMessage
      } catch (e: any) {
        logger.error(e, {
          tags: { file: 'EmbeddedWalletProvider.ts', function: 'signMessage' },
        })
        throw e
      }
    }
    const signTransaction = async (transaction: any): Promise<HexString> => {
      try {
        const signedTransactions = await signTransactionsWithPasskey([safeJSONStringify(transaction)], address)
        const signedTransaction = signedTransactions?.[0]
        if (!signedTransaction || !isValidHexString(signedTransaction)) {
          throw new Error(`Invalid signed transaction: ${signedTransaction}`)
        }
        return signedTransaction
      } catch (e: any) {
        logger.error(e, {
          tags: { file: 'EmbeddedWalletProvider.ts', function: 'signTransaction' },
        })
        throw e
      }
    }
    const signTypedData = async (transaction: any): Promise<HexString> => {
      try {
        const signedTypedData = await signTypedDataWithPasskey([safeJSONStringify(transaction)], address)
        const signature = signedTypedData?.[0]
        if (!signature || !isValidHexString(signature)) {
          throw new Error(`Invalid signature: ${signature}`)
        }
        return signature
      } catch (e: any) {
        logger.error(e, {
          tags: { file: 'EmbeddedWalletProvider.ts', function: 'signTypedData' },
        })
        throw e
      }
    }
    const account: Account = {
      address,
      signMessage,
      signTransaction,
      signTypedData,
      publicKey: address,
      source: 'custom',
      type: 'local',
    }
    return account
  }

  async estimateGas(params: any) {
    const account = this.getAccount()
    if (!account) {
      const error = new Error('Attempted embedded wallet function with no embedded wallet connected')
      logger.error(error, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'estimateGas' },
      })
      throw error
    }
    const client = this.getPublicClient(this.chainId)
    const data = await client.estimateGas({
      ...params[0],
      account: account.address,
      value: BigInt(params[0].value ?? 0),
    })
    return data
  }
  async call(params: any) {
    const client = this.getPublicClient(this.chainId)
    let blockNumber = params[1]
    if (blockNumber === 'latest') {
      blockNumber = await this.getBlockNumber()
    }
    const { data } = await client.call({ ...params[0], blockNumber })
    return data
  }

  async getAccounts() {
    // TODO[EW]: handle multiple accounts
    const account = this.getAccount()

    return [account?.address]
  }

  async sendTransaction(transactions: any) {
    try {
      const account = this.getAccount()
      if (!account) {
        logger.error(NoWalletFoundError, {
          tags: { file: 'EmbeddedWalletProvider.ts', function: 'sendTransaction' },
        })
        throw NoWalletFoundError
      }
      const publicClient = this.getPublicClient(this.chainId)
      const [currentGasData, nonce] = await Promise.all([
        publicClient.estimateFeesPerGas({ chain: getChainInfo(this.chainId) }),
        publicClient.getTransactionCount({ address: account.address }),
      ])
      const tx = {
        ...transactions[0],
        gas: (BigInt(Number(transactions[0].gas ?? 0)) * BigInt(12)) / BigInt(10), // add 20% buffer, TODO[EW]: play around with this
        value: BigInt(transactions[0].value ?? 0),
        chainId: this.chainId,
        maxFeePerGas: BigInt(transactions[0].maxFeePerGas ?? currentGasData.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(transactions[0].maxPriorityFeePerGas ?? currentGasData.maxPriorityFeePerGas),
        nonce: transactions[0].nonce ?? nonce,
      }
      const signedTx = await account.signTransaction(tx)
      const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx })
      return txHash
    } catch (e: any) {
      logger.debug('EmbeddedWalletProvider.ts', 'sendTransaction', e, transactions)
      return undefined
    }
  }
  updateChainId(chainId: UniverseChainId) {
    this.chainId = chainId
    localStorage.setItem('embeddedUniswapWallet.chainId', `${chainId}`)
    this.emit('chainChanged', chainId)
  }

  getChainId() {
    return this.chainId
  }

  async getCode(args: RequestArgs) {
    const client = this.getPublicClient(this.chainId)

    const data = await client.getBytecode({
      address: args.params?.[0],
    })
    return data
  }

  async getBlockNumber() {
    const client = this.getPublicClient(this.chainId)

    return await client.getBlockNumber()
  }

  async getTransactionByHash(hash: Hash) {
    const client = this.getPublicClient(this.chainId)

    try {
      const rest = await client.getTransaction({
        hash,
      })
      // fixes a type mismatch where type was expected to be a BigNumber
      return { ...rest, type: rest.typeHex }
    } catch (e) {
      if (e.name === 'TransactionNotFoundError') {
        return null
      }
      logger.error(e, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'getTransactionByHash' },
      })
      throw e
    }
  }

  async getTransactionReceipt(hash: Hash) {
    const client = this.getPublicClient(this.chainId)

    try {
      const { ...rest } = await client.getTransactionReceipt({
        hash,
      })

      return rest
    } catch (e) {
      if (e.name === 'TransactionNotFoundError') {
        return null
      }
      logger.error(e, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'getTransactionReceipt' },
      })
      throw e
    }
  }

  async signMessage(args: RequestArgs) {
    const account = this.getAccount()
    if (!account) {
      logger.error(NoWalletFoundError, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'signMessage' },
      })
      throw NoWalletFoundError
    }
    return await account.signMessage({ message: args.params?.[0] })
  }

  async sign(args: RequestArgs) {
    const account = this.getAccount()
    if (!account) {
      logger.error(NoWalletFoundError, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'sign' },
      })
      throw NoWalletFoundError
    }
    return await account.signMessage(args.params?.[0])
  }

  async signTypedData(args: RequestArgs) {
    const account = this.getAccount()
    if (!account) {
      logger.error(NoWalletFoundError, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'signTypedData' },
      })
      throw NoWalletFoundError
    }
    if (!args.params) {
      throw new Error('Missing params')
    }

    if (!args.params[0]) {
      throw new Error('Missing domain')
    }

    return await account.signTypedData(JSON.parse(args.params[1]))
  }
}

export const embeddedWalletProvider = EmbeddedWalletProvider.getInstance()
