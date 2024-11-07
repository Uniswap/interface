import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ALL_GQL_CHAINS, GQL_MAINNET_CHAINS } from 'uniswap/src/features/chains/chainInfo'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getChainIdFromChainUrlParam } from 'utils/chainParams'

test.each(GQL_MAINNET_CHAINS)('GQL_MAINNET_CHAINS generates the correct chains', (chain: GqlChainId) => {
  expect(GQL_MAINNET_CHAINS.includes(chain)).toBe(true)
  expect(GQL_MAINNET_CHAINS.length).toEqual(GQL_MAINNET_CHAINS.length)
})

test.each(ALL_GQL_CHAINS)('UX_SUPPORTED_GQL_CHAINS generates the correct chains', (chain: GqlChainId) => {
  expect(ALL_GQL_CHAINS.includes(chain)).toBe(true)
  expect(ALL_GQL_CHAINS.length).toEqual(ALL_GQL_CHAINS.length)
})

const chainIdToBackendName: { [key: number]: GqlChainId } = {
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
    const name = toGraphQLChain(chainId)
    expect(name).toBe(chainIdToBackendName[chainId])
  },
)

describe('getChainFromChainUrlParam', () => {
  it('should return true for valid chain slug', () => {
    const validChainName = 'ethereum'
    expect(getChainIdFromChainUrlParam(validChainName)).toBe(UniverseChainId.Mainnet)
  })

  it('should return false for undefined chain slug', () => {
    const undefinedChainName = undefined
    expect(getChainIdFromChainUrlParam(undefinedChainName)).toBe(undefined)
  })

  it('should return false for invalid chain slug', () => {
    const invalidChainName = 'invalidchain'
    expect(getChainIdFromChainUrlParam(invalidChainName)).toBe(undefined)
  })

  it('should return false for a misconfigured chain slug', () => {
    const invalidChainName = 'eThErEuM'
    expect(getChainIdFromChainUrlParam(invalidChainName)).toBe(undefined)
  })
})
