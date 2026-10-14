import { GraphQLApi } from '@universe/api'

interface TokenData {
  symbol: string
}
interface AuctionData {
  tokenName: string
  tokenSymbol: string
  tokenLogoUrl?: string
  currencySymbol?: string
}
interface PoolData {
  token0Symbol?: string
  token1Symbol?: string
  feeTier?: string
  protocolVersion: GraphQLApi.ProtocolVersion
  token0Image?: string
  token1Image?: string
}

export type PositionStatus = 'in_range' | 'out_of_range' | 'closed'

export interface Data {
  title: string
  image: string
  url: string
  description?: string
  name?: string
  ogImage?: string
  auctionData?: AuctionData
  poolData?: PoolData
  tokenData?: TokenData
  positionStatus?: PositionStatus
}

// All runtimes are Node, so a process-local Map replaces the Workers Cache API.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_ENTRIES = 1000

class Cache {
  private readonly entries = new Map<string, { data: Data; expiresAt: number }>()

  async match(request: string): Promise<Data | undefined> {
    const hit = this.entries.get(request)
    if (!hit) {
      return undefined
    }
    if (hit.expiresAt < Date.now()) {
      this.entries.delete(request)
      return undefined
    }
    const { data } = hit
    if (!data.title || !data.image || !data.url) {
      return undefined
    }
    return data
  }

  async put(data: Data, request: string): Promise<void> {
    if (this.entries.size >= MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value
      if (oldest !== undefined) {
        this.entries.delete(oldest)
      }
    }
    this.entries.set(request, { data, expiresAt: Date.now() + MAX_AGE_MS })
  }
}

export default new Cache()
