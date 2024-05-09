import { ChainId } from '@uniswap/sdk-core'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

import {
  BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS,
  BACKEND_SUPPORTED_CHAINS,
  CHAIN_IDS_TO_NAMES,
  CHAIN_ID_TO_BACKEND_NAME,
  CHAIN_INFO,
  CHAIN_NAME_TO_CHAIN_ID,
  ChainSlug,
  GQL_MAINNET_CHAINS,
  INFURA_PREFIX_TO_CHAIN_ID,
  InterfaceGqlChain,
  L1_CHAIN_IDS,
  L2_CHAIN_IDS,
  PUBLIC_RPC_URLS,
  SUPPORTED_GAS_ESTIMATE_CHAIN_IDS,
  SUPPORTED_INTERFACE_CHAIN_IDS,
  SupportedInterfaceChainId,
  TESTNET_CHAIN_IDS,
  UX_SUPPORTED_GQL_CHAINS,
  getChainFromChainUrlParam,
  getChainPriority,
} from './chains'

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
  [ChainId.BLAST, 8],
]

test.each(chainPriorityTestCases)(
  'getChainPriority returns expected priority for a given ChainId %O',
  (chainId: ChainId, expectedPriority: number) => {
    const priority = getChainPriority(chainId)
    expect(priority).toBe(expectedPriority)
  }
)

const chainIdNames: { [chainId in SupportedInterfaceChainId]: string } = {
  [ChainId.MAINNET]: 'mainnet',
  [ChainId.GOERLI]: 'goerli',
  [ChainId.SEPOLIA]: 'sepolia',
  [ChainId.POLYGON]: 'polygon',
  [ChainId.POLYGON_MUMBAI]: 'polygon_mumbai',
  [ChainId.CELO]: 'celo',
  [ChainId.CELO_ALFAJORES]: 'celo_alfajores',
  [ChainId.ARBITRUM_ONE]: 'arbitrum',
  [ChainId.ARBITRUM_GOERLI]: 'arbitrum_goerli',
  [ChainId.OPTIMISM]: 'optimism',
  [ChainId.OPTIMISM_GOERLI]: 'optimism_goerli',
  [ChainId.BNB]: 'bnb',
  [ChainId.AVALANCHE]: 'avalanche',
  [ChainId.BASE]: 'base',
  [ChainId.BLAST]: 'blast',
} as const

test.each(Object.keys(chainIdNames).map((key) => parseInt(key) as SupportedInterfaceChainId))(
  'CHAIN_IDS_TO_NAMES generates the correct chainIds',
  (chainId: SupportedInterfaceChainId) => {
    const name = CHAIN_IDS_TO_NAMES[chainId]
    expect(name).toBe(chainIdNames[chainId])
  }
)

const supportedGasEstimateChains = [
  ChainId.MAINNET,
  ChainId.POLYGON,
  ChainId.CELO,
  ChainId.OPTIMISM,
  ChainId.ARBITRUM_ONE,
  ChainId.BNB,
  ChainId.AVALANCHE,
  ChainId.BASE,
  ChainId.BLAST,
] as const

test.each(supportedGasEstimateChains)(
  'SUPPORTED_GAS_ESTIMATE_CHAIN_IDS generates the correct chainIds',
  (chainId: SupportedInterfaceChainId) => {
    expect(SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)).toBe(true)
    expect(SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.length).toEqual(supportedGasEstimateChains.length)
  }
)

const testnetChainIds = [
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON_MUMBAI,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM_GOERLI,
  ChainId.CELO_ALFAJORES,
] as const

test.each(testnetChainIds)('TESTNET_CHAIN_IDS generates the correct chainIds', (chainId: SupportedInterfaceChainId) => {
  expect(TESTNET_CHAIN_IDS.includes(chainId)).toBe(true)
  expect(TESTNET_CHAIN_IDS.length).toEqual(testnetChainIds.length)
})

const l1ChainIds = [
  ChainId.MAINNET,
  ChainId.GOERLI,
  ChainId.SEPOLIA,
  ChainId.POLYGON,
  ChainId.POLYGON_MUMBAI,
  ChainId.CELO,
  ChainId.CELO_ALFAJORES,
  ChainId.BNB,
  ChainId.AVALANCHE,
] as const

test.each(l1ChainIds)('L1_CHAIN_IDS generates the correct chainIds', (chainId: SupportedInterfaceChainId) => {
  expect(L1_CHAIN_IDS.includes(chainId)).toBe(true)
  expect(L1_CHAIN_IDS.length).toEqual(l1ChainIds.length)
})

const l2ChainIds = [
  ChainId.ARBITRUM_ONE,
  ChainId.ARBITRUM_GOERLI,
  ChainId.OPTIMISM,
  ChainId.OPTIMISM_GOERLI,
  ChainId.BASE,
  ChainId.BLAST,
] as const

test.each(l2ChainIds)('L2_CHAIN_IDS generates the correct chainIds', (chainId: SupportedInterfaceChainId) => {
  expect(L2_CHAIN_IDS.includes(chainId)).toBe(true)
  expect(L2_CHAIN_IDS.length).toEqual(l2ChainIds.length)
})

const GQLMainnetChains = [
  Chain.Ethereum,
  Chain.Polygon,
  Chain.Celo,
  Chain.Optimism,
  Chain.Arbitrum,
  Chain.Bnb,
  Chain.Avalanche,
  Chain.Base,
  Chain.Blast,
] as const

const GQL_TESTNET_CHAINS = [Chain.EthereumGoerli, Chain.EthereumSepolia] as const
const uxSupportedGQLChains = [...GQLMainnetChains, ...GQL_TESTNET_CHAINS] as const

test.each(GQLMainnetChains)('GQL_MAINNET_CHAINS generates the correct chains', (chain: InterfaceGqlChain) => {
  expect(GQL_MAINNET_CHAINS.includes(chain)).toBe(true)
  expect(GQL_MAINNET_CHAINS.length).toEqual(GQLMainnetChains.length)
})

test.each(uxSupportedGQLChains)('UX_SUPPORTED_GQL_CHAINS generates the correct chains', (chain: InterfaceGqlChain) => {
  expect(UX_SUPPORTED_GQL_CHAINS.includes(chain)).toBe(true)
  expect(UX_SUPPORTED_GQL_CHAINS.length).toEqual(uxSupportedGQLChains.length)
})

const chainIdToBackendName: { [key: number]: InterfaceGqlChain } = {
  [ChainId.MAINNET]: Chain.Ethereum,
  [ChainId.GOERLI]: Chain.EthereumGoerli,
  [ChainId.SEPOLIA]: Chain.EthereumSepolia,
  [ChainId.POLYGON]: Chain.Polygon,
  [ChainId.POLYGON_MUMBAI]: Chain.Polygon,
  [ChainId.CELO]: Chain.Celo,
  [ChainId.CELO_ALFAJORES]: Chain.Celo,
  [ChainId.ARBITRUM_ONE]: Chain.Arbitrum,
  [ChainId.ARBITRUM_GOERLI]: Chain.Arbitrum,
  [ChainId.OPTIMISM]: Chain.Optimism,
  [ChainId.OPTIMISM_GOERLI]: Chain.Optimism,
  [ChainId.BNB]: Chain.Bnb,
  [ChainId.AVALANCHE]: Chain.Avalanche,
  [ChainId.BASE]: Chain.Base,
  [ChainId.BLAST]: Chain.Blast,
}

test.each(Object.keys(chainIdToBackendName).map((key) => parseInt(key) as SupportedInterfaceChainId))(
  'CHAIN_IDS_TO_BACKEND_NAME generates the correct chains',
  (chainId: SupportedInterfaceChainId) => {
    const name = CHAIN_ID_TO_BACKEND_NAME[chainId]
    expect(name).toBe(chainIdToBackendName[chainId])
  }
)

const chainToChainId = {
  [Chain.Ethereum]: ChainId.MAINNET,
  [Chain.EthereumGoerli]: ChainId.GOERLI,
  [Chain.EthereumSepolia]: ChainId.SEPOLIA,
  [Chain.Polygon]: ChainId.POLYGON,
  [Chain.Celo]: ChainId.CELO,
  [Chain.Optimism]: ChainId.OPTIMISM,
  [Chain.Arbitrum]: ChainId.ARBITRUM_ONE,
  [Chain.Bnb]: ChainId.BNB,
  [Chain.Avalanche]: ChainId.AVALANCHE,
  [Chain.Base]: ChainId.BASE,
  [Chain.Blast]: ChainId.BLAST,
} as const

test.each(Object.keys(chainToChainId).map((key) => key as InterfaceGqlChain))(
  'CHAIN_NAME_TO_CHAIN_ID generates the correct chains',
  (chain) => {
    const chainId = CHAIN_NAME_TO_CHAIN_ID[chain]
    expect(chainId).toBe(chainToChainId[chain])
  }
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
] as const

test.each(backendSupportedChains)(
  'BACKEND_SUPPORTED_CHAINS generates the correct chains',
  (chain: InterfaceGqlChain) => {
    expect(BACKEND_SUPPORTED_CHAINS.includes(chain)).toBe(true)
    expect(BACKEND_SUPPORTED_CHAINS.length).toEqual(backendSupportedChains.length)
  }
)

const backendNotyetSupportedChainIds = [ChainId.AVALANCHE] as const

test.each(backendNotyetSupportedChainIds)(
  'BACKEND_SUPPORTED_CHAINS generates the correct chains',
  (chainId: SupportedInterfaceChainId) => {
    expect(BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.includes(chainId)).toBe(true)
    expect(BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.length).toEqual(backendNotyetSupportedChainIds.length)
  }
)

const publicRpcUrls: Record<SupportedInterfaceChainId, string[]> = {
  [ChainId.MAINNET]: [
    // "Safe" URLs
    'https://api.mycryptoapi.com/eth',
    'https://cloudflare-eth.com',
    // "Fallback" URLs
    'https://rpc.ankr.com/eth',
    'https://eth-mainnet.public.blastapi.io',
  ],
  [ChainId.GOERLI]: [
    // "Safe" URLs
    'https://rpc.goerli.mudit.blog/',
    // "Fallback" URLs
    'https://rpc.ankr.com/eth_goerli',
  ],
  [ChainId.SEPOLIA]: [
    // "Safe" URLs
    'https://rpc.sepolia.dev/',
    // "Fallback" URLs
    'https://rpc.sepolia.org/',
    'https://rpc2.sepolia.org/',
    'https://rpc.sepolia.online/',
    'https://www.sepoliarpc.space/',
    'https://rpc-sepolia.rockx.com/',
    'https://rpc.bordel.wtf/sepolia',
  ],
  [ChainId.POLYGON]: [
    // "Safe" URLs
    'https://polygon-rpc.com/',
    'https://rpc-mainnet.matic.network',
    'https://matic-mainnet.chainstacklabs.com',
    'https://rpc-mainnet.maticvigil.com',
    'https://rpc-mainnet.matic.quiknode.pro',
    'https://matic-mainnet-full-rpc.bwarelabs.com',
  ],
  [ChainId.POLYGON_MUMBAI]: [
    // "Safe" URLs
    'https://matic-mumbai.chainstacklabs.com',
    'https://rpc-mumbai.maticvigil.com',
    'https://matic-testnet-archive-rpc.bwarelabs.com',
  ],
  [ChainId.ARBITRUM_ONE]: [
    // "Safe" URLs
    'https://arb1.arbitrum.io/rpc',
    // "Fallback" URLs
    'https://arbitrum.public-rpc.com',
  ],
  [ChainId.ARBITRUM_GOERLI]: [
    // "Safe" URLs
    'https://goerli-rollup.arbitrum.io/rpc',
  ],
  [ChainId.OPTIMISM]: [
    // "Safe" URLs
    'https://mainnet.optimism.io/',
    // "Fallback" URLs
    'https://rpc.ankr.com/optimism',
  ],
  [ChainId.OPTIMISM_GOERLI]: [
    // "Safe" URLs
    'https://goerli.optimism.io',
  ],
  [ChainId.CELO]: [
    // "Safe" URLs
    `https://forno.celo.org`,
  ],
  [ChainId.CELO_ALFAJORES]: [
    // "Safe" URLs
    `https://alfajores-forno.celo-testnet.org`,
  ],
  [ChainId.BNB]: [
    // "Safe" URLs
    'https://endpoints.omniatech.io/v1/bsc/mainnet/public',
    'https://bsc-mainnet.gateway.pokt.network/v1/lb/6136201a7bad1500343e248d',
    'https://1rpc.io/bnb',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed2.defibit.io',
    'https://bsc-dataseed1.ninicoin.io',
    'https://binance.nodereal.io',
    'https://bsc-dataseed4.defibit.io',
    'https://rpc.ankr.com/bsc',
  ],
  [ChainId.AVALANCHE]: [
    // "Safe" URLs
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avalanche-c-chain.publicnode.com',
  ],
  [ChainId.BASE]: [
    // "Safe" URLs
    'https://mainnet.base.org/',
    'https://developer-access-mainnet.base.org/',
    'https://base.gateway.tenderly.co',
    'https://base.publicnode.com',
    // "Fallback" URLs
    'https://1rpc.io/base',
    'https://base.meowrpc.com',
  ],
  [ChainId.BLAST]: [
    // "Safe" URLs
    'https://rpc.blast.io/',
    'https://rpc.ankr.com/blast',
    'https://blast.din.dev/rpc',
    'https://blastl2-mainnet.public.blastapi.io',
    'https://blast.blockpi.network/v1/rpc/public',
  ],
}

test.each(Object.keys(publicRpcUrls).map((key) => parseInt(key) as SupportedInterfaceChainId))(
  'PUBLIC_RPC_URLS generates the correct chains',
  (chain) => {
    const urls = PUBLIC_RPC_URLS[chain]
    expect(urls).toEqual(publicRpcUrls[chain])
  }
)

const infuraPrefixToChainId: { [prefix: string]: SupportedInterfaceChainId } = {
  mainnet: ChainId.MAINNET,
  goerli: ChainId.GOERLI,
  sepolia: ChainId.SEPOLIA,
  'optimism-mainnet': ChainId.OPTIMISM,
  'optimism-goerli': ChainId.OPTIMISM_GOERLI,
  'arbitrum-mainnet': ChainId.ARBITRUM_ONE,
  'arbitrum-goerli': ChainId.ARBITRUM_GOERLI,
  'polygon-mainnet': ChainId.POLYGON,
  'polygon-mumbai': ChainId.POLYGON_MUMBAI,
  'avalanche-mainnet': ChainId.AVALANCHE,
  'base-mainnet': ChainId.BASE,
  'blast-mainnet': ChainId.BLAST,
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
    case ChainId.ARBITRUM_ONE:
      return 46
    case ChainId.OPTIMISM:
      return 6
    case ChainId.POLYGON:
      return 5
    case ChainId.BASE:
      return 6
    case ChainId.BNB:
      return 4
    case ChainId.AVALANCHE:
      return 6
    case ChainId.CELO:
      return 2
    default:
      return 1
  }
}

test.each(SUPPORTED_INTERFACE_CHAIN_IDS)(
  'CHAIN_INFO maps the correct blocks per mainnet epoch for chainId',
  (chainId: SupportedInterfaceChainId) => {
    const block = CHAIN_INFO[chainId].blockPerMainnetEpochForChainId
    expect(block).toEqual(getBlocksPerMainnetEpochForChainId(chainId))
  }
)

describe('getChainFromChainUrlParam', () => {
  it('should return true for valid chain slug', () => {
    const validChainName = 'ethereum'
    expect(getChainFromChainUrlParam(validChainName)?.id).toBe(ChainId.MAINNET)
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
