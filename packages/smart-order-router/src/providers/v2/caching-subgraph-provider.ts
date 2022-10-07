import { ChainId } from '../../util/chains';

import { ICache } from './../cache';
import { IV2SubgraphProvider, V2SubgraphPool } from './subgraph-provider';

/**
 * Provider for getting V2 pools, with functionality for caching the results.
 *
 * @export
 * @class CachingV2SubgraphProvider
 */
export class CachingV2SubgraphProvider implements IV2SubgraphProvider {
  private SUBGRAPH_KEY = (chainId: ChainId) => `subgraph-pools-v2-${chainId}`;

  /**
   * Creates an instance of CachingV2SubgraphProvider.
   * @param chainId The chain id to use.
   * @param subgraphProvider The provider to use to get the subgraph pools when not in the cache.
   * @param cache Cache instance to hold cached pools.
   */
  constructor(
    private chainId: ChainId,
    protected subgraphProvider: IV2SubgraphProvider,
    private cache: ICache<V2SubgraphPool[]>
  ) {}

  public async getPools(): Promise<V2SubgraphPool[]> {
    const cachedPools = await this.cache.get(this.SUBGRAPH_KEY(this.chainId));

    if (cachedPools) {
      return cachedPools;
    }

    const pools = await this.subgraphProvider.getPools();

    await this.cache.set(this.SUBGRAPH_KEY(this.chainId), pools);

    return pools;
  }
}
