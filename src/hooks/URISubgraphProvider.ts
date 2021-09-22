import { ChainId, ISubgraphProvider, SubgraphPool } from '@uniswap/smart-order-router'

// TODO create new RTK-Query API over the ipfs url
// pass in the cached data to the provider.. provider becomes a simple wrapper ?
// rtk-query handles caching the response and parsing it
export class URISubgraphProvider implements ISubgraphProvider {
  constructor(private chainId: ChainId, private uri: string) {}

  public async getPools(): Promise<SubgraphPool[]> {
    try {
      const response = await fetch(this.uri)
      const poolsBuffer = await response.json()
      const { status } = response as any

      if (status != 200) {
        console.error({ response }, `Unabled to get pools from ${this.uri}.`)

        throw new Error(`Unable to get pools from ${this.uri}`)
      }

      const pools = poolsBuffer as SubgraphPool[]

      console.info({ uri: this.uri, chain: this.chainId }, `Got subgraph pools from uri. Num: ${pools.length}`)

      return pools
    } catch (err) {
      console.info({ uri: this.uri, chain: this.chainId }, `Failed to get subgraph pools from uri.`)

      throw err
    }
  }
}
