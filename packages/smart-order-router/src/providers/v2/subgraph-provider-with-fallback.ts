import { Token } from '@uniswap/sdk-core';

import { log } from '../../util';
import { ProviderConfig } from '../provider';

import { IV2SubgraphProvider, V2SubgraphPool } from './subgraph-provider';

/**
 * Provider for getting V2 subgraph pools that falls back to a different provider
 * in the event of failure.
 *
 * @export
 * @class V2SubgraphProviderWithFallBacks
 */
export class V2SubgraphProviderWithFallBacks implements IV2SubgraphProvider {
  /**
   * Creates an instance of V2SubgraphProviderWithFallBacks.
   * @param fallbacks Ordered list of `IV2SubgraphProvider` to try to get pools from.
   */
  constructor(private fallbacks: IV2SubgraphProvider[]) {}

  public async getPools(
    tokenIn?: Token,
    tokenOut?: Token,
    providerConfig?: ProviderConfig
  ): Promise<V2SubgraphPool[]> {
    for (let i = 0; i < this.fallbacks.length; i++) {
      const provider = this.fallbacks[i]!;
      try {
        const pools = await provider.getPools(
          tokenIn,
          tokenOut,
          providerConfig
        );
        return pools;
      } catch (err) {
        log.info(`Failed to get subgraph pools for V2 from fallback #${i}`);
      }
    }

    throw new Error('Failed to get subgraph pools from any providers');
  }
}
