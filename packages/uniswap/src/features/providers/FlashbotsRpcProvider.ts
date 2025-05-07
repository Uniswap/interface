import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { id } from '@ethersproject/hash'
import { resolveProperties } from '@ethersproject/properties'
import { BlockTag, JsonRpcProvider } from '@ethersproject/providers'
import { ConnectionInfo, fetchJson } from '@ethersproject/web'
import { sleep } from 'utilities/src/time/timing'
import { z } from 'zod'

/**
 * A provider that uses a signer to authenticate requests.
 */
class AuthenticatedJsonRpcProvider extends JsonRpcProvider {
  protected readonly signer?: Signer

  constructor(url: string, signer?: Signer) {
    super(url)
    this.signer = signer
  }
}

/**
 * Interface representing the structure of the response from Flashbots API.
 * @see {@link https://protect.flashbots.net/tx/docs}
 */
const FlashbotsReceiptSchema = z.object({
  status: z.enum(['UNKNOWN', 'PENDING', 'INCLUDED', 'FAILED', 'CANCELLED']),
  hash: z.string(),
  maxBlockNumber: z.number(),
  transaction: z.object({
    from: z.string(),
    to: z.string(),
    gasLimit: z.string(),
    maxFeePerGas: z.string(),
    maxPriorityFeePerGas: z.string(),
    nonce: z.string(),
    value: z.string(),
  }),
  fastMode: z.boolean(),
  seenInMempool: z.boolean(),
  simError: z.string().optional(),
})

type FlashbotsReceipt = z.infer<typeof FlashbotsReceiptSchema>

export type SignerInfo = {
  signer: Signer
  address: Address
}

export const FLASHBOTS_RPC_URL = 'https://rpc.flashbots.net/fast?originId=uniswapwallet'
export const FLASHBOTS_DEFAULT_BLOCK_RANGE = 10
export const FLASHBOTS_DEFAULT_REFUND_PERCENT = 50 // Default for fast mode

/**
 * A provider to Flashbots RPC that uses a signer to authenticate requests.
 */
export class FlashbotsRpcProvider extends AuthenticatedJsonRpcProvider {
  private signatureHeaderName = 'X-Flashbots-Signature'

  /**
   * Create a Flashbots RPC provider.
   * @param blockRange - The maximum number of blocks in which the transaction will be included.
   *    @default 10
   *    @see {@link https://docs.flashbots.net/flashbots-protect/settings-guide#block-range}
   * @param signer - The signer to use for authenticated requests.
   */
  constructor(blockRange: number, signerInfo?: SignerInfo, refundPercent?: number) {
    const blockRangeString = blockRange > 0 ? `&blockRange=${blockRange}` : ''
    const refundString = getRefundString(signerInfo?.address, refundPercent)
    const url = `${FLASHBOTS_RPC_URL}${blockRangeString}${refundString}`
    super(url, signerInfo?.signer)
  }

  /**
   * Get the transaction count for an address.
   *
   * When requests are made for the pending block, the provider will include an authentication header,
   * so that the Flashbots RPC includes the private pending transactions for the address.
   *
   * Implemented based off [BaseProvider.getTransactionCount](https://github.com/ethers-io/ethers.js/blob/ea2d2453a535a319ad55e7ca739ab1bcdb1432b7/packages/providers/src.ts/base-provider.ts#L1460)
   * and [JsonRpcProvider.send](https://github.com/ethers-io/ethers.js/blob/9f990c57f0486728902d4b8e049536f2bb3487ee/packages/providers/src.ts/json-rpc-provider.ts#L502).
   *
   * @param address - The address to get the transaction count for.
   * @param blockTag - The block tag to get the transaction count for.
   * @returns The transaction count for the address.
   */
  async getTransactionCount(
    addressOrName: string | Promise<string>,
    blockTag?: BlockTag | Promise<BlockTag>,
  ): Promise<number> {
    const params = await resolveProperties({
      address: this._getAddress(addressOrName),
      blockTag: this._getBlockTag(blockTag || 'latest'),
    })
    const signerAddress = await this.signer?.getAddress()

    if (!this.signer || signerAddress !== params.address || params.blockTag !== 'pending') {
      return super.getTransactionCount(params.address, params.blockTag)
    }

    await this.getNetwork()

    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionCount',
      params: [params.address, params.blockTag],
      id: this._nextId++,
    })

    this.emit('debug', {
      action: 'request',
      request,
      provider: this,
    })

    const signature = await this.signer.signMessage(id(request))

    const connection: ConnectionInfo = {
      ...this.connection,
      headers: {
        ...this.connection.headers,
        [this.signatureHeaderName]: `${params.address}:${signature}`,
      },
    }

    const result = await fetchJson(connection, request, getResult).then(
      (callResult: unknown) => {
        this.emit('debug', {
          action: 'response',
          request,
          response: callResult,
          provider: this,
        })

        return callResult
      },
      (error) => {
        this.emit('debug', {
          action: 'response',
          error,
          request,
          provider: this,
        })

        throw error
      },
    )

    return BigNumber.from(result).toNumber()
  }
}

function getRefundString(address?: Address, refundPercent?: number): string {
  if (!address || !refundPercent || refundPercent < 0 || refundPercent > 100) {
    return ''
  }
  return `&refund=${address}:${refundPercent}`
}

// Copied from JsonRpcProvider.getResult
function getResult(payload: {
  error?: { code?: number; data?: unknown; message?: string }
  result?: unknown
}): unknown {
  if (payload.error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const error: any = new Error(payload.error.message)
    error.code = payload.error.code
    error.data = payload.error.data
    throw error
  }

  return payload.result
}

const POLL_INTERVAL_MS = 4000
const MAX_ATTEMPTS = (25 * 12000) / POLL_INTERVAL_MS // 25 blocks of 12 seconds, queried every 4 seconds

/**
 * Waits for a Flashbots Protect transaction receipt by polling the Flashbots Protect API until a final status is reached or we reach the max attempts.
 * @param hash - The transaction hash to wait for.
 * @returns A promise that resolves to the final status of the transaction.
 * @throws Will throw an error if the polling exceeds the max attempts or if there is an issue fetching the transaction status.
 */
export async function waitForFlashbotsProtectReceipt(hash: string): Promise<FlashbotsReceipt> {
  const url = `https://protect.flashbots.net/tx/${hash}`
  let attempt = 0

  while (true) {
    if (attempt >= MAX_ATTEMPTS) {
      throw new Error(`Polling Flashbots Protect API for transaction ${hash} reached maximum ${MAX_ATTEMPTS} attempts`)
    }

    const connection: ConnectionInfo = {
      url,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const data: FlashbotsReceipt = await fetchJson(connection, undefined, (payload) => {
      // Validate and return the payload as FlashbotsReceipt
      try {
        return FlashbotsReceiptSchema.parse(payload)
      } catch (error) {
        throw new Error(`Invalid response structure from Flashbots API: ${error}`)
      }
    })

    if (data.status !== 'PENDING') {
      return data
    }

    // Wait for POLL_INTERVAL_MS milliseconds before the next check
    await sleep(POLL_INTERVAL_MS)
    attempt++
  }
}
