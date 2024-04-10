import { ChainId } from '@uniswap/sdk-core'

import { getChainPriority } from './chains'

// Define an array of test cases with chainId and expected priority
const chainPriorityTestCases: [ChainId, number][] = [
  [ChainId.MAINNET, 0],
  [ChainId.GOERLI, 0],
  [ChainId.SEPOLIA, 0],
  [ChainId.ARBITRUM_ONE, 1],
  [ChainId.ARBITRUM_GOERLI, 1],
  [ChainId.OPTIMISM, 2],
  [ChainId.OPTIMISM_GOERLI, 2],
  [ChainId.POLYGON, 3],
  [ChainId.POLYGON_MUMBAI, 3],
  [ChainId.BASE, 4],
  [ChainId.BNB, 5],
  [ChainId.AVALANCHE, 6],
  [ChainId.CELO, 7],
  [ChainId.CELO_ALFAJORES, 7],
]

test.each(chainPriorityTestCases)(
  'getChainPriority returns expected priority for a given ChainId %O',
  (chainId: ChainId, expectedPriority: number) => {
    const priority = getChainPriority(chainId)
    expect(priority).toBe(expectedPriority)
  }
)
