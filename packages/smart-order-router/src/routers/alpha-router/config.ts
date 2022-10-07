import { ChainId } from '../../util/chains';

import { AlphaRouterConfig } from './alpha-router';

export const DEFAULT_ROUTING_CONFIG_BY_CHAIN = (
  chainId: ChainId
): AlphaRouterConfig => {
  switch (chainId) {
    // Optimism
    case ChainId.OPTIMISM:
    case ChainId.OPTIMISTIC_KOVAN:
    case ChainId.OPTIMISTIC_GOERLI:
      return {
        v2PoolSelection: {
          topN: 3,
          topNDirectSwaps: 1,
          topNTokenInOut: 5,
          topNSecondHop: 2,
          topNWithEachBaseToken: 2,
          topNWithBaseToken: 6,
        },
        v3PoolSelection: {
          topN: 2,
          topNDirectSwaps: 2,
          topNTokenInOut: 2,
          topNSecondHop: 1,
          topNWithEachBaseToken: 3,
          topNWithBaseToken: 3,
        },
        maxSwapsPerPath: 3,
        minSplits: 1,
        maxSplits: 7,
        distributionPercent: 10,
        forceCrossProtocol: false,
      };
    // Arbitrum calls have lower gas limits and tend to timeout more, which causes us to reduce the multicall
    // batch size and send more multicalls per quote. To reduce the amount of requests each quote sends, we
    // have to adjust the routing config so we explore fewer routes.
    case ChainId.ARBITRUM_ONE:
    case ChainId.ARBITRUM_RINKEBY:
    case ChainId.CELO:
    case ChainId.CELO_ALFAJORES:
      return {
        v2PoolSelection: {
          topN: 3,
          topNDirectSwaps: 1,
          topNTokenInOut: 5,
          topNSecondHop: 2,
          topNWithEachBaseToken: 2,
          topNWithBaseToken: 6,
        },
        v3PoolSelection: {
          topN: 2,
          topNDirectSwaps: 2,
          topNTokenInOut: 2,
          topNSecondHop: 1,
          topNWithEachBaseToken: 3,
          topNWithBaseToken: 2,
        },
        maxSwapsPerPath: 2,
        minSplits: 1,
        maxSplits: 7,
        distributionPercent: 25,
        forceCrossProtocol: false,
      };
    default:
      return {
        v2PoolSelection: {
          topN: 3,
          topNDirectSwaps: 1,
          topNTokenInOut: 5,
          topNSecondHop: 2,
          topNWithEachBaseToken: 2,
          topNWithBaseToken: 6,
        },
        v3PoolSelection: {
          topN: 2,
          topNDirectSwaps: 2,
          topNTokenInOut: 3,
          topNSecondHop: 1,
          topNWithEachBaseToken: 3,
          topNWithBaseToken: 5,
        },
        maxSwapsPerPath: 3,
        minSplits: 1,
        maxSplits: 7,
        distributionPercent: 5,
        forceCrossProtocol: false,
      };
  }
};
export const ETH_GAS_STATION_API_URL =
  'https://ethgasstation.info/api/ethgasAPI.json';
