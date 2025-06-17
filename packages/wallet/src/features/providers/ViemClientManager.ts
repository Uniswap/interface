import { Signer } from 'ethers'
import { RPCType, UniverseChainId } from 'uniswap/src/features/chains/types'
import { createViemClient } from 'uniswap/src/features/providers/createViemClient'
import { PublicClient } from 'viem'

type ViemClientInfo = Partial<{
  public?: PublicClient
  private?: PublicClient
}>

type ChainIdToViemClient = Partial<Record<UniverseChainId, ViemClientInfo>>

export class ViemClientManager {
  private readonly _viemClients: ChainIdToViemClient = {}

  private onUpdate: (() => void) | null = null

  setOnUpdate(onUpdate: () => void): void {
    this.onUpdate = onUpdate
  }

  createViemClient(chainId: UniverseChainId): undefined {
    const client = createViemClient({ chainId })
    if (!client) {
      return
    }

    this._viemClients[chainId] = {
      ...this._viemClients[chainId],
      public: client,
    }
    this.onUpdate?.()
  }

  createPrivateViemClient({
    chainId,
    signer,
    address,
  }: {
    chainId: UniverseChainId
    signer?: Signer
    address?: Address
  }): undefined {
    const signerInfo = signer && address ? { signer, address } : undefined
    const client = createViemClient({ chainId, rpcType: RPCType.Private, signerInfo })
    if (!client) {
      return
    }

    this._viemClients[chainId] = {
      ...this._viemClients[chainId],
      private: client,
    }
    this.onUpdate?.()
  }

  getViemClient(chainId: UniverseChainId): PublicClient {
    const cachedClient = this._viemClients[chainId]?.public
    if (!cachedClient) {
      this.createViemClient(chainId)
    }

    const clientDetails = this._viemClients[chainId]?.public
    if (!clientDetails) {
      throw new Error(`Viem client doesn't exist for chain ${chainId}`)
    }

    return clientDetails
  }

  async getPrivateViemClient(chainId: UniverseChainId, signer?: Signer): Promise<PublicClient> {
    const signerAddress = await signer?.getAddress()
    const cachedClient = this._viemClients[chainId]?.private
    if (!cachedClient) {
      this.createPrivateViemClient({ chainId, signer, address: signerAddress })
    }

    const clientDetails = this._viemClients[chainId]?.private
    if (!clientDetails) {
      throw new Error(`Viem client doesn't exist for chain ${chainId}`)
    }

    return clientDetails
  }
}
