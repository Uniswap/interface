import { ChainId } from '@uniswap/sdk-core'

import { getChainPriority } from './chains'

// Define an array of test cases with chainId and expected priority
const chainPriorityTestCases: [ChainId, number][] = [
  [ChainId.MAINNET, 0],
  [ChainId.GOERLI, 0],
  [ChainId.SEPOLIA, 0],
  [ChainId.POLYGON, 1],
  [ChainId.POLYGON_MUMBAI, 1],
  [ChainId.ARBITRUM_ONE, 2],
  [ChainId.ARBITRUM_GOERLI, 2],
  [ChainId.OPTIMISM, 3],
  [ChainId.OPTIMISM_GOERLI, 3],
  [ChainId.BNB, 4],
  [ChainId.AVALANCHE, 5],
  [ChainId.CELO, 6],
  [ChainId.CELO_ALFAJORES, 6],
]

test.each(chainPriorityTestCases)(
  'getChainPriority returns expected priority for a given ChainId %O',
  (chainId: ChainId, expectedPriority: number) => {
    const priority = getChainPriority(chainId)
    expect(priority).toBe(expectedPriority)
  }
)
