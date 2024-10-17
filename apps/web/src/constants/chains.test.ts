import {
  BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS,
  BACKEND_SUPPORTED_CHAINS,
  CHAIN_IDS_TO_NAMES,
  CHAIN_ID_TO_BACKEND_NAME,
  CHAIN_NAME_TO_CHAIN_ID,
  ChainSlug,
  INFURA_PREFIX_TO_CHAIN_ID,
  InterfaceGqlChain,
  SUPPORTED_GAS_ESTIMATE_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  UX_SUPPORTED_GQL_CHAINS,
  getChainFromChainUrlParam,
  getChainPriority,
} from 'constants/chains'
import { GQL_MAINNET_CHAINS, GQL_TESTNET_CHAINS, UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SUPPORTED_CHAIN_IDS, UniverseChainId } from 'uniswap/src/types/chains'

// Define an array of test cases with chainId and expected priority
const chainPriorityTestCases: [UniverseChainId, number][] = [
  [UniverseChainId.Mainnet, 0],
  [UniverseChainId.Sepolia, 0],
  [UniverseChainId.ArbitrumOne, 1],
  [UniverseChainId.Optimism, 2],
  [UniverseChainId.Polygon, 3],
  [UniverseChainId.Base, 4],
  [UniverseChainId.Bnb, 5],
  [UniverseChainId.Avalanche, 6],
  [UniverseChainId.Celo, 7],
  [UniverseChainId.Blast, 8],
  [UniverseChainId.Zora, 9],
  [UniverseChainId.Zksync, 10],
]

test.each(chainPriorityTestCases)(
  'getChainPriority returns expected priority for a given ChainId %O',
  (chainId: UniverseChainId, expectedPriority: number) => {
    const priority = getChainPriority(chainId)
    expect(priority).toBe(expectedPriority)
  },
)

const chainIdNames: { [chainId in UniverseChainId]: string } = {
  [UniverseChainId.Mainnet]: 'mainnet',
  [UniverseChainId.Sepolia]: 'sepolia',
  [UniverseChainId.Polygon]: 'polygon',
  [UniverseChainId.Celo]: 'celo',
  [UniverseChainId.ArbitrumOne]: 'arbitrum',
  [UniverseChainId.Optimism]: 'optimism',
  [UniverseChainId.Bnb]: 'bnb',
  [UniverseChainId.Avalanche]: 'avalanche',
  [UniverseChainId.Base]: 'base',
  [UniverseChainId.Blast]: 'blast',
  [UniverseChainId.WorldChain]: 'worldchain',
  [UniverseChainId.Zora]: 'zora',
  [UniverseChainId.Zksync]: 'zksync',
  [UniverseChainId.AstrochainSepolia]: 'astrochain',
} as const

test.each(Object.keys(chainIdNames).map((key) => parseInt(key) as UniverseChainId))(
  'CHAIN_IDS_TO_NAMES generates the correct chainIds',
  (chainId: UniverseChainId) => {
    const name = CHAIN_IDS_TO_NAMES[chainId]
    expect(name).toBe(chainIdNames[chainId])
  },
)

const supportedGasEstimateChains = [
  UniverseChainId.Mainnet,
  UniverseChainId.Polygon,
  UniverseChainId.Celo,
  UniverseChainId.Optimism,
  UniverseChainId.ArbitrumOne,
  UniverseChainId.Bnb,
  UniverseChainId.Avalanche,
  UniverseChainId.Base,
  UniverseChainId.Blast,
  UniverseChainId.Zora,
] as const

test.each(supportedGasEstimateChains)(
  'SUPPORTED_GAS_ESTIMATE_CHAIN_IDS generates the correct chainIds',
  (chainId: UniverseChainId) => {
    expect(SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)).toBe(true)
    expect(SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.length).toEqual(supportedGasEstimateChains.length)
  },
)

const testnetChainIds = [UniverseChainId.Sepolia, UniverseChainId.AstrochainSepolia] as const

test.each(testnetChainIds)('TESTNET_CHAIN_IDS generates the correct chainIds', (chainId: UniverseChainId) => {
  expect(TESTNET_CHAIN_IDS.includes(chainId)).toBe(true)
  expect(TESTNET_CHAIN_IDS.length).toEqual(testnetChainIds.length)
})

const uxSupportedGQLChains = [...GQL_MAINNET_CHAINS, ...GQL_TESTNET_CHAINS] as const

test.each(GQL_MAINNET_CHAINS)('GQL_MAINNET_CHAINS generates the correct chains', (chain: InterfaceGqlChain) => {
  expect(GQL_MAINNET_CHAINS.includes(chain)).toBe(true)
  expect(GQL_MAINNET_CHAINS.length).toEqual(GQL_MAINNET_CHAINS.length)
})

test.each(uxSupportedGQLChains)('UX_SUPPORTED_GQL_CHAINS generates the correct chains', (chain: InterfaceGqlChain) => {
  expect(UX_SUPPORTED_GQL_CHAINS.includes(chain)).toBe(true)
  expect(UX_SUPPORTED_GQL_CHAINS.length).toEqual(uxSupportedGQLChains.length)
})

const chainIdToBackendName: { [key: number]: InterfaceGqlChain } = {
  [UniverseChainId.Mainnet]: Chain.Ethereum,
  [UniverseChainId.Sepolia]: Chain.EthereumSepolia,
  [UniverseChainId.Polygon]: Chain.Polygon,
  [UniverseChainId.Celo]: Chain.Celo,
  [UniverseChainId.ArbitrumOne]: Chain.Arbitrum,
  [UniverseChainId.Optimism]: Chain.Optimism,
  [UniverseChainId.Bnb]: Chain.Bnb,
  [UniverseChainId.Avalanche]: Chain.Avalanche,
  [UniverseChainId.Base]: Chain.Base,
  [UniverseChainId.Blast]: Chain.Blast,
  [UniverseChainId.Zora]: Chain.Zora,
}

test.each(Object.keys(chainIdToBackendName).map((key) => parseInt(key) as UniverseChainId))(
  'CHAIN_IDS_TO_BACKEND_NAME generates the correct chains',
  (chainId: UniverseChainId) => {
    const name = CHAIN_ID_TO_BACKEND_NAME[chainId]
    expect(name).toBe(chainIdToBackendName[chainId])
  },
)

const chainToChainId = {
  [Chain.Ethereum]: UniverseChainId.Mainnet,
  [Chain.EthereumSepolia]: UniverseChainId.Sepolia,
  [Chain.Polygon]: UniverseChainId.Polygon,
  [Chain.Celo]: UniverseChainId.Celo,
  [Chain.Optimism]: UniverseChainId.Optimism,
  [Chain.Arbitrum]: UniverseChainId.ArbitrumOne,
  [Chain.Bnb]: UniverseChainId.Bnb,
  [Chain.Avalanche]: UniverseChainId.Avalanche,
  [Chain.Base]: UniverseChainId.Base,
  [Chain.Blast]: UniverseChainId.Blast,
  [Chain.Worldchain]: UniverseChainId.WorldChain,
  [Chain.Zora]: UniverseChainId.Zora,
  [Chain.Zksync]: UniverseChainId.Zksync,
} as const

test.each(Object.keys(chainToChainId).map((key) => key as InterfaceGqlChain))(
  'CHAIN_NAME_TO_CHAIN_ID generates the correct chains',
  (chain) => {
    const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
    expect(chainId).toBe(chainToChainId[chain as Exclude<InterfaceGqlChain, Chain.AstrochainSepolia>]) // will remove this after AstrochainSepolia is added
  },
)

const backendSupportedChains = [
  Chain.Ethereum,
  Chain.Arbitrum,
  Chain.Optimism,
  Chain.Polygon,
  Chain.Base,
  Chain.Bnb,
  Chain.Celo,
  Chain.Blast,
  Chain.Avalanche,
  Chain.Worldchain,
  Chain.Zksync,
] as const

test.each(backendSupportedChains)(
  'BACKEND_SUPPORTED_CHAINS generates the correct chains',
  (chain: InterfaceGqlChain) => {
    expect(BACKEND_SUPPORTED_CHAINS.includes(chain)).toBe(true)
    expect(BACKEND_SUPPORTED_CHAINS.length).toEqual(backendSupportedChains.length)
  },
)

const backendNotyetSupportedChainIds = [UniverseChainId.Zora] as const

test.each(backendNotyetSupportedChainIds)(
  'BACKEND_SUPPORTED_CHAINS generates the correct chains',
  (chainId: UniverseChainId) => {
    expect(BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.includes(chainId)).toBe(true)
    expect(BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.length).toEqual(backendNotyetSupportedChainIds.length)
  },
)

const infuraPrefixToChainId: { [prefix: string]: UniverseChainId } = {
  mainnet: UniverseChainId.Mainnet,
  sepolia: UniverseChainId.Sepolia,
  'optimism-mainnet': UniverseChainId.Optimism,
  'arbitrum-mainnet': UniverseChainId.ArbitrumOne,
  'polygon-mainnet': UniverseChainId.Polygon,
  'avalanche-mainnet': UniverseChainId.Avalanche,
  'base-mainnet': UniverseChainId.Base,
  'blast-mainnet': UniverseChainId.Blast,
}

test.each(Object.keys(infuraPrefixToChainId))('INFURA_PREFIX_TO_CHAIN_ID generates the correct chains', (chainName) => {
  const chain = INFURA_PREFIX_TO_CHAIN_ID[chainName]
  expect(chain).toEqual(infuraPrefixToChainId[chainName])
  expect(Object.keys(infuraPrefixToChainId).length).toEqual(Object.keys(infuraPrefixToChainId).length)
})

function getBlocksPerMainnetEpochForChainId(chainId: number | undefined): number {
  // Average block times were pulled from https://dune.com/jacobdcastro/avg-block-times on 2024-03-14,
  // and corroborated with that chain's documentation/explorer.
  // Blocks per mainnet epoch is computed as `Math.floor(12s / AVG_BLOCK_TIME)` and hard-coded.
  switch (chainId) {
    case UniverseChainId.ArbitrumOne:
      return 46
    case UniverseChainId.Optimism:
      return 6
    case UniverseChainId.Polygon:
      return 5
    case UniverseChainId.Base:
      return 6
    case UniverseChainId.Bnb:
      return 4
    case UniverseChainId.Avalanche:
      return 6
    case UniverseChainId.Celo:
      return 2
    case UniverseChainId.Zksync:
      return 12
    default:
      return 1
  }
}

test.each(SUPPORTED_CHAIN_IDS)(
  'CHAIN_INFO maps the correct blocks per mainnet epoch for chainId',
  (chainId: UniverseChainId) => {
    const block = UNIVERSE_CHAIN_INFO[chainId].blockPerMainnetEpochForChainId
    expect(block).toEqual(getBlocksPerMainnetEpochForChainId(chainId))
  },
)

describe('getChainFromChainUrlParam', () => {
  it('should return true for valid chain slug', () => {
    const validChainName = 'ethereum'
    expect(getChainFromChainUrlParam(validChainName)?.id).toBe(UniverseChainId.Mainnet)
  })

  it('should return false for undefined chain slug', () => {
    const undefinedChainName = undefined
    expect(getChainFromChainUrlParam(undefinedChainName)?.id).toBe(undefined)
  })

  it('should return false for invalid chain slug', () => {
    const invalidChainName = 'invalidchain'
    expect(getChainFromChainUrlParam(invalidChainName as ChainSlug)?.id).toBe(undefined)
  })

  it('should return false for a misconfigured chain slug', () => {
    const invalidChainName = 'eThErEuM'
    expect(getChainFromChainUrlParam(invalidChainName as ChainSlug)?.id).toBe(undefined)
  })
})
