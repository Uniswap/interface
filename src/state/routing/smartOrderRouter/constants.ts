import { AlphaRouterConfig, ChainId } from '@uniswap/smart-order-router'

export const SUPPORTED_CHAINS: ChainId[] = [ChainId.MAINNET, ChainId.RINKEBY]

export const DEFAULT_ROUTING_CONFIG: AlphaRouterConfig = {
  topN: 2,
  topNDirectSwaps: 2,
  topNTokenInOut: 3,
  topNSecondHop: 0,
  topNWithEachBaseToken: 3,
  topNWithBaseToken: 6,
  topNWithBaseTokenInSet: false,
  maxSwapsPerPath: 3,
  minSplits: 1,
  maxSplits: 7,
  distributionPercent: 5,
}
