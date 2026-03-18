import { GraphQLApi } from '@universe/api'

interface TokenData {
  symbol: string
}
interface PoolData {
  token0Symbol?: string
  token1Symbol?: string
  feeTier: string
  protocolVersion: GraphQLApi.ProtocolVersion
  token0Image?: string
  token1Image?: string
}

export interface Data {
  title: string
  image: string
  url: string
  name?: string
  ogImage?: string
  poolData?: PoolData
  tokenData?: TokenData
}

const CACHE_NAME = 'functions-cache' as const

class Cache {
  async match(request: string): Promise<Data | undefined> {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(request)
    if (!response) {
      return undefined
    }
    const data: Data = JSON.parse(await response.text())
    if (!data.title || !data.image || !data.url) {
      return undefined
    }
    return data
  }

  async put(data: Data, request: string) {
    // Set max age to 1 week
    const response = new Response(JSON.stringify(data))
    response.headers.set('Cache-Control', 'max-age=604800')
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response)
  }
}

export default new Cache()
