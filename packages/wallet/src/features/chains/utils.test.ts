import { BigNumber } from 'ethers'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { ChainId } from 'uniswap/src/types/chains'
import { TESTNET_CHAIN_IDS } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  chainIdToHexadecimalString,
  fromGraphQLChain,
  fromMoonpayNetwork,
  fromUniswapWebAppLink,
  getPollingIntervalByBlocktime,
  hexadecimalStringToInt,
  isTestnet,
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
    expect(fromGraphQLChain(Chain.UnknownChain)).toEqual(null)
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

describe(chainIdToHexadecimalString, () => {
  it('handles supported chain', () => {
    expect(chainIdToHexadecimalString(ChainId.ArbitrumOne)).toEqual('0xa4b1')
  })
})

describe('hexadecimalStringToInt', () => {
  it('converts valid hexadecimal strings to integers', () => {
    expect(hexadecimalStringToInt('1')).toEqual(1)
    expect(hexadecimalStringToInt('a')).toEqual(10)
    expect(hexadecimalStringToInt('A')).toEqual(10)
    expect(hexadecimalStringToInt('10')).toEqual(16)
    expect(hexadecimalStringToInt('FF')).toEqual(255)
    expect(hexadecimalStringToInt('ff')).toEqual(255)
    expect(hexadecimalStringToInt('100')).toEqual(256)
  })

  it('converts hexadecimal strings with prefix to integers', () => {
    expect(hexadecimalStringToInt('0x1')).toEqual(1)
    expect(hexadecimalStringToInt('0xa')).toEqual(10)
    expect(hexadecimalStringToInt('0xA')).toEqual(10)
    expect(hexadecimalStringToInt('0x10')).toEqual(16)
    expect(hexadecimalStringToInt('0xFF')).toEqual(255)
    expect(hexadecimalStringToInt('0xff')).toEqual(255)
    expect(hexadecimalStringToInt('0x100')).toEqual(256)
  })

  it('handles invalid hexadecimal strings', () => {
    expect(hexadecimalStringToInt('')).toBeNaN()
    expect(hexadecimalStringToInt('g')).toBeNaN()
    expect(hexadecimalStringToInt('0x')).toBeNaN()
    expect(hexadecimalStringToInt('0xg')).toBeNaN()
  })
})
