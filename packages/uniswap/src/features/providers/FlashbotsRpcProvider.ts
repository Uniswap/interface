import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { id } from '@ethersproject/hash'
import { resolveProperties } from '@ethersproject/properties'
import { BlockTag, JsonRpcProvider, Networkish } from '@ethersproject/providers'
import { ConnectionInfo, fetchJson } from '@ethersproject/web'
import {
  buildFlashbotsUrl,
  FLASHBOTS_SIGNATURE_HEADER,
  SignerInfo,
} from 'uniswap/src/features/providers/FlashbotsCommon'

/**
 * A provider that uses a signer to authenticate requests.
 */
class AuthenticatedJsonRpcProvider extends JsonRpcProvider {
  protected readonly signer?: Signer

  constructor(config: { url: string; signer?: Signer; network?: Networkish }) {
    super(config.url, config.network)
    this.signer = config.signer
  }
}

/**
 * A provider to Flashbots RPC that uses a signer to authenticate requests.
 */
export class FlashbotsRpcProvider extends AuthenticatedJsonRpcProvider {
  private signatureHeaderName = FLASHBOTS_SIGNATURE_HEADER

  /**
   * Create a Flashbots RPC provider.
   * @param signer - The signer to use for authenticated requests.
   * @param refundPercent - The percentage of the transaction fee to refund to the user. 0 <= refundPercent <= 100
   *    @default 50
   *    @see {@link https://docs.flashbots.net/flashbots-protect/settings-guide#refunds}
   */
  constructor({
    signerInfo,
    refundPercent,
    network,
  }: {
    signerInfo?: SignerInfo
    refundPercent?: number
    network?: Networkish
  }) {
    const url = buildFlashbotsUrl({
      address: signerInfo?.address,
      refundPercent,
    })
    super({ url, signer: signerInfo?.signer, network })
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

// Copied from JsonRpcProvider.getResult
function getResult(payload: {
  error?: { code?: number; data?: unknown; message?: string }
  result?: unknown
}): unknown {
  if (payload.error) {
    // biome-ignore lint/suspicious/noExplicitAny: legacy code requires any for compatibility
    const error: any = new Error(payload.error.message)
    error.code = payload.error.code
    error.data = payload.error.data
    throw error
  }

  return payload.result
}
