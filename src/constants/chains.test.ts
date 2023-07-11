import { ChainId } from '@uniswap/sdk-core'

import { getChainPriority } from './chains'

// Define an array of test cases with chainId and expected priority
const testCases: { chainId: ChainId; expectedPriority: number }[] = [
  { chainId: ChainId.MAINNET, expectedPriority: 0 },
  { chainId: ChainId.GOERLI, expectedPriority: 0 },
  { chainId: ChainId.SEPOLIA, expectedPriority: 0 },
  { chainId: ChainId.POLYGON, expectedPriority: 1 },
  { chainId: ChainId.POLYGON_MUMBAI, expectedPriority: 1 },
  { chainId: ChainId.ARBITRUM_ONE, expectedPriority: 2 },
  { chainId: ChainId.ARBITRUM_GOERLI, expectedPriority: 2 },
  { chainId: ChainId.OPTIMISM, expectedPriority: 3 },
  { chainId: ChainId.OPTIMISM_GOERLI, expectedPriority: 3 },
  { chainId: ChainId.BNB, expectedPriority: 4 },
  { chainId: ChainId.AVALANCHE, expectedPriority: 5 },
  { chainId: ChainId.CELO, expectedPriority: 6 },
  { chainId: ChainId.CELO_ALFAJORES, expectedPriority: 6 },
]

// Run the tests
testCases.forEach(({ chainId, expectedPriority }) => {
  test(`getChainPriority - ${chainId}`, () => {
    const priority = getChainPriority(chainId)
    expect(priority).toBe(expectedPriority)
  })
})
