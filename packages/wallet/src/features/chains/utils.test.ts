import { BigNumber } from 'ethers'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId, TESTNET_CHAIN_IDS } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  fromGraphQLChain,
  fromMoonpayNetwork,
  fromUniswapWebAppLink,
  getPollingIntervalByBlocktime,
  isTestnet,
  toGraphQLChain,
  toSupportedChainId,
  toUniswapWebAppLink,
} from 'wallet/src/features/chains/utils'

describe(toSupportedChainId, () => {
  it('handles undefined input', () => {
    expect(toSupportedChainId(undefined)).toEqual(null)
  })

  it('handles unsupported chain ID', () => {
    expect(toSupportedChainId(BigNumber.from(6767))).toEqual(null)
  })

  it('handles supported chain ID', () => {
    expect(toSupportedChainId(ChainId.Polygon)).toEqual(137)
  })
})

describe(isTestnet, () => {
  it('handles non-testnet', () => {
    expect(isTestnet(ChainId.Mainnet)).toEqual(false)
  })

  it('handles testnet', () => {
    expect(isTestnet(TESTNET_CHAIN_IDS[0])).toEqual(true)
  })
})

describe(fromGraphQLChain, () => {
  it('handles undefined', () => {
    expect(fromGraphQLChain(undefined)).toEqual(null)
  })

  it('handles supported chain', () => {
    expect(fromGraphQLChain(Chain.Arbitrum)).toEqual(ChainId.ArbitrumOne)
  })

  it('handles unsupported chain', () => {
    expect(fromGraphQLChain(Chain.Celo)).toEqual(null)
  })
})

describe(toGraphQLChain, () => {
  it('handles supported chain', () => {
    expect(toGraphQLChain(ChainId.Mainnet)).toEqual(Chain.Ethereum)
  })

  it('handle unsupported chain', () => {
    expect(toGraphQLChain(ChainId.PolygonMumbai)).toEqual(null)
  })
})

describe(fromMoonpayNetwork, () => {
  it('handles supported chain', () => {
    expect(fromMoonpayNetwork(undefined)).toEqual(ChainId.Mainnet)
    expect(fromMoonpayNetwork(Chain.Arbitrum.toLowerCase())).toEqual(ChainId.ArbitrumOne)
    expect(fromMoonpayNetwork(Chain.Optimism.toLowerCase())).toEqual(ChainId.Optimism)
    expect(fromMoonpayNetwork(Chain.Polygon.toLowerCase())).toEqual(ChainId.Polygon)
    expect(fromMoonpayNetwork(Chain.Base.toLowerCase())).toEqual(ChainId.Base)
  })

  it('handle unsupported chain', () => {
    expect(fromMoonpayNetwork('unknown')).toBeUndefined()
  })
})

describe(getPollingIntervalByBlocktime, () => {
  it('returns the correct value for L1', () => {
    expect(getPollingIntervalByBlocktime(ChainId.Mainnet)).toEqual(PollingInterval.Fast)
  })

  it('returns the correct value for L2', () => {
    expect(getPollingIntervalByBlocktime(ChainId.Polygon)).toEqual(PollingInterval.LightningMcQueen)
  })
})

describe(fromUniswapWebAppLink, () => {
  it('handles supported chain', () => {
    expect(fromUniswapWebAppLink(Chain.Ethereum.toLowerCase())).toEqual(ChainId.Mainnet)
    expect(fromUniswapWebAppLink(Chain.Arbitrum.toLowerCase())).toEqual(ChainId.ArbitrumOne)
    expect(fromUniswapWebAppLink(Chain.Optimism.toLowerCase())).toEqual(ChainId.Optimism)
    expect(fromUniswapWebAppLink(Chain.Polygon.toLowerCase())).toEqual(ChainId.Polygon)
    // TODO: add Base test once Chain includes Base (GQL reliant)
  })

  it('handle unsupported chain', () => {
    expect(() => fromUniswapWebAppLink('unkwnown')).toThrow('Network "unkwnown" can not be mapped')
  })
})

describe(toUniswapWebAppLink, () => {
  it('handles supported chain', () => {
    expect(toUniswapWebAppLink(ChainId.Mainnet)).toEqual(Chain.Ethereum.toLowerCase())
    expect(toUniswapWebAppLink(ChainId.ArbitrumOne)).toEqual(Chain.Arbitrum.toLowerCase())
    expect(toUniswapWebAppLink(ChainId.Optimism)).toEqual(Chain.Optimism.toLowerCase())
    expect(toUniswapWebAppLink(ChainId.Polygon)).toEqual(Chain.Polygon.toLowerCase())
    // TODO: add Base test once Chain includes Base (GQL reliant)
  })

  it('handle unsupported chain', () => {
    expect(() => fromUniswapWebAppLink('unkwnown')).toThrow('Network "unkwnown" can not be mapped')
  })
})
