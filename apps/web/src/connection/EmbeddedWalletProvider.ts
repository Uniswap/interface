import { HexString, isValidHexString } from '@universe/encoding'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { applyGasBuffer } from 'uniswap/src/features/gas/utils'
import {
  signMessageWithPasskey,
  signTransactionWithPasskey,
  signTypedDataWithPasskey,
} from 'uniswap/src/features/passkey/embeddedWallet'
import {
  checkEmbeddedWalletDelegation,
  type EthTransactionParams,
  sendDelegatedTransaction,
} from 'uniswap/src/features/passkey/embeddedWalletDelegation'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import type { Account, PublicClient } from 'viem'
import type { RpcUserOperation } from 'viem/account-abstraction'
import type { Capability, GetCallsStatusResult } from 'wallet/src/features/dappRequests/types'
import type { Hash, SignableMessage } from '~/chains'
import { getEmbeddedWalletCallsStatus } from '~/connection/getCallsStatus'
import { getEmbeddedWalletCapabilities } from '~/connection/getCapabilities'
import { sendEmbeddedWalletCalls, type WalletSendCallsRequest } from '~/connection/sendCalls'
import { prepareDelegationAuthorization, signUserOpWithEmbeddedWallet } from '~/connection/userOpSigning'
import { getEmbeddedWalletState, setChainId } from '~/state/embeddedWallet/store'
import { assume0xAddress } from '~/utils/wagmi'

export type Listener = (payload: any) => void

type RequestArgs = {
  method: string
  params?: any[]
}

// JSON.stringify does not handle BigInts, so we need to convert them to strings
const safeJSONStringify = (param: any): any => {
  return JSON.stringify(
    param,
    // oxlint-disable-next-line typescript/no-unsafe-return -- biome-parity: oxlint is stricter here
    (_, value) => (typeof value === 'bigint' ? value.toString() : value), // return everything else unchanged
  )
}

const NoWalletFoundError = new Error('Attempted embedded wallet function with no embedded wallet connected')

/**
 * Resolves a viem `PublicClient` for a given chain. Injected at the boundary
 * (see `embeddedWalletProviderInstance.ts`) — this class never reaches for a
 * module-scoped singleton, so the dependency is visible at the constructor
 * signature and trivially stubbable in tests.
 */
export type GetViemClient = (chainId: UniverseChainId) => PublicClient

export interface EmbeddedWalletProviderDeps {
  getViemClient: GetViemClient
}

export class EmbeddedWalletProvider {
  listeners: Map<string, Set<Listener>>
  chainId: UniverseChainId
  private readonly getPublicClient: GetViemClient

  constructor(deps: EmbeddedWalletProviderDeps) {
    this.listeners = new Map()
    const { chainId } = getEmbeddedWalletState()
    this.chainId = chainId ?? 1
    this.getPublicClient = deps.getViemClient
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
        return this.sendTransaction(args.params ?? [])
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
      case 'wallet_getCapabilities':
        return this.getCapabilities(args.params?.[1])
      case 'wallet_sendCalls':
        return this.sendCalls(args.params?.[0])
      case 'wallet_getCallsStatus':
        return this.getCallsStatus(args.params?.[0])
      default: {
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
    const { walletAddress, walletId } = getEmbeddedWalletState()
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
        const signedMessage = await signMessageWithPasskey(message.toString(), walletId ?? undefined)
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
        const signedTransaction = await signTransactionWithPasskey(
          safeJSONStringify(transaction),
          walletId ?? undefined,
        )
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
        const signedTypedData = await signTypedDataWithPasskey(safeJSONStringify(transaction), walletId ?? undefined)
        const signature = signedTypedData
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
      throw NoWalletFoundError
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

  async sendTransaction(transactions: unknown[]) {
    try {
      const account = this.getAccount()
      if (!account) {
        throw NoWalletFoundError
      }

      const { walletId } = getEmbeddedWalletState()
      const originalTx = transactions[0] as EthTransactionParams | undefined
      const hasCalldata = originalTx?.data && originalTx.data !== '0x' && originalTx.data !== ''
      const delegationResult = hasCalldata ? await checkEmbeddedWalletDelegation(account.address, this.chainId) : null
      if (delegationResult && (delegationResult.needsDelegation || delegationResult.isWalletDelegatedToUniswap)) {
        const { signTransaction } = account
        // oxlint-disable-next-line typescript/no-unnecessary-condition -- defensive: Account union includes JsonRpcAccount which lacks signTransaction
        if (!signTransaction) {
          throw new Error('Account does not support signTransaction')
        }
        return sendDelegatedTransaction({
          transactions: transactions as EthTransactionParams[],
          account,
          delegationResult,
          chainId: this.chainId,
          publicClient: this.getPublicClient(this.chainId),
          signTransaction,
          walletId: walletId ?? undefined,
        })
      }

      return this.sendStandardTransaction(transactions, account)
    } catch (e: unknown) {
      logger.error(e, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'sendTransaction' },
      })
      // Propagate so callers can tell user rejection from network/estimation failures.
      throw e
    }
  }

  private async sendStandardTransaction(transactions: unknown[], account: Account) {
    const publicClient = this.getPublicClient(this.chainId)
    const [feePerGasEstimates, nonce] = await Promise.all([
      publicClient.estimateFeesPerGas({ chain: getChainInfo(this.chainId) }),
      publicClient.getTransactionCount({ address: account.address }),
    ])
    const txData = transactions[0] as Record<string, unknown>
    const toAddr = String(txData.to ?? '')
    const txCalldata = String(txData.data ?? '0x')
    const gas =
      txData.gas != null
        ? applyGasBuffer(BigInt(Number(txData.gas)))
        : applyGasBuffer(
            await publicClient.estimateGas({
              account: account.address,
              to: isValidHexString(toAddr) ? (toAddr as HexString) : undefined,
              data: isValidHexString(txCalldata) ? (txCalldata as HexString) : undefined,
              value: BigInt(String(txData.value ?? 0)),
            }),
          )
    const tx = {
      ...txData,
      gas,
      value: BigInt(String(txData.value ?? 0)),
      chainId: this.chainId,
      maxFeePerGas: BigInt(String(txData.maxFeePerGas ?? feePerGasEstimates.maxFeePerGas)),
      maxPriorityFeePerGas: BigInt(String(txData.maxPriorityFeePerGas ?? feePerGasEstimates.maxPriorityFeePerGas)),
      nonce: txData.nonce != null ? Number(txData.nonce) : nonce,
    }
    if (!account.signTransaction) {
      throw new Error('Account does not support signTransaction')
    }
    const signedTx = await account.signTransaction(tx)
    const txHash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx })
    return txHash
  }

  /**
   * EIP-5792 `wallet_getCapabilities`. Delegation-status-derived capability map
   * lives in {@link getEmbeddedWalletCapabilities}. Rollout is controlled by the
   * existing flow-level gates (`batched_swaps`, `liquidity_batched_transactions`,
   * `support_7677_gas_sponsorship`) — consumers ignore these capabilities until
   * those flags enable the batched paths.
   */
  async getCapabilities(requestedChainIds?: string[]): Promise<Record<string, Capability>> {
    const account = this.getAccount()
    if (!account) {
      return {}
    }
    return getEmbeddedWalletCapabilities({ address: account.address, requestedChainIds })
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
      throw NoWalletFoundError
    }
    return await account.signMessage({ message: args.params?.[0] })
  }

  async sign(args: RequestArgs) {
    const account = this.getAccount()
    if (!account) {
      throw NoWalletFoundError
    }
    return await account.signMessage(args.params?.[0])
  }

  async signTypedData(args: RequestArgs) {
    const account = this.getAccount()
    if (!account) {
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

  /**
   * Sign an ERC-4337 PackedUserOperation with the embedded wallet. Full flow
   * (EIP-712 typed data → passkey `eth_signTypedData_v4` → Calibur envelope → optional
   * EIP-7702 authorization) lives in {@link signUserOpWithEmbeddedWallet}.
   */
  async signUserOp(rpcUserOp: RpcUserOperation<'0.8'>): Promise<RpcUserOperation<'0.8'>> {
    const account = this.getAccount()
    const { walletId } = getEmbeddedWalletState()
    if (!account || !walletId) {
      logger.error(NoWalletFoundError, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'signUserOp' },
      })
      throw NoWalletFoundError
    }
    return signUserOpWithEmbeddedWallet({
      rpcUserOp,
      address: assume0xAddress(account.address),
      chainId: this.chainId,
      walletId,
      publicClient: this.getPublicClient(this.chainId),
    })
  }

  /**
   * EIP-5792 `wallet_getCallsStatus`. Status resolution (Trading API `/swaps`
   * feed, covering both 4337 userOp hashes and 7702 tx hashes) lives in
   * {@link getEmbeddedWalletCallsStatus}.
   */
  async getCallsStatus(batchId: string | undefined): Promise<GetCallsStatusResult> {
    return getEmbeddedWalletCallsStatus({ batchId, chainId: this.chainId })
  }

  /**
   * EIP-5792 `wallet_sendCalls`. Dispatch (sponsored 4337 vs Calibur multicall)
   * lives in {@link sendEmbeddedWalletCalls}.
   */
  async sendCalls(params: WalletSendCallsRequest | undefined): Promise<{ id: string }> {
    if (!params) {
      throw new Error('wallet_sendCalls: missing params')
    }
    const account = this.getAccount()
    if (!account) {
      logger.error(NoWalletFoundError, {
        tags: { file: 'EmbeddedWalletProvider.ts', function: 'sendCalls' },
      })
      throw NoWalletFoundError
    }
    return sendEmbeddedWalletCalls({
      params,
      activeChainId: this.chainId,
      account: account.address,
      signUserOp: (userOp) => this.signUserOp(userOp),
      sendTransaction: (transactions) => this.sendTransaction(transactions),
      prepareDelegationAuth: (sender, chainId) =>
        prepareDelegationAuthorization({
          address: assume0xAddress(sender),
          chainId,
          walletId: getEmbeddedWalletState().walletId ?? undefined,
          publicClient: this.getPublicClient(chainId),
        }),
    })
  }
}
