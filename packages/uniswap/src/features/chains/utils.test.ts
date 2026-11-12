import { BigNumber } from '@ethersproject/bignumber'
import { UniverseChainId } from '@universe/chains'
import { AppId } from '@universe/config'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ALL_CHAIN_IDS } from 'uniswap/src/features/chains/chainInfo'
import {
  chainIdToHexadecimalString,
  fromUniswapWebAppLink,
  getEnabledChains,
  getPollingIntervalByBlocktime,
  hexadecimalStringToInt,
  toSupportedChainId,
  toUniswapWebAppLink,
} from 'uniswap/src/features/chains/utils'

describe(toSupportedChainId, () => {
  it('handles undefined input', () => {
    expect(toSupportedChainId(undefined)).toEqual(null)
  })

  it('handles unsupported chain ID', () => {
    expect(toSupportedChainId(BigNumber.from(6767))).toEqual(null)
  })

  it('handles supported chain ID', () => {
    expect(toSupportedChainId(UniverseChainId.Polygon)).toEqual(137)
  })
})

describe(getPollingIntervalByBlocktime, () => {
  it('returns the correct value for L1', () => {
    expect(getPollingIntervalByBlocktime(UniverseChainId.Mainnet)).toEqual(PollingInterval.Fast)
  })

  it('returns the correct value for L2', () => {
    expect(getPollingIntervalByBlocktime(UniverseChainId.Polygon)).toEqual(PollingInterval.LightningMcQueen)
  })
})

describe(fromUniswapWebAppLink, () => {
  it('handles supported chain', () => {
    expect(fromUniswapWebAppLink('ethereum')).toEqual(UniverseChainId.Mainnet)
    expect(fromUniswapWebAppLink('arbitrum')).toEqual(UniverseChainId.ArbitrumOne)
    expect(fromUniswapWebAppLink('optimism')).toEqual(UniverseChainId.Optimism)
    expect(fromUniswapWebAppLink('polygon')).toEqual(UniverseChainId.Polygon)
    expect(fromUniswapWebAppLink('megaeth')).toEqual(UniverseChainId.MegaETH)
    expect(fromUniswapWebAppLink('base')).toEqual(UniverseChainId.Base)
    expect(fromUniswapWebAppLink('ethereum_sepolia')).toEqual(UniverseChainId.Sepolia)
  })

  it('maps both the current and legacy Unichain Sepolia slugs', () => {
    expect(fromUniswapWebAppLink('unichain_sepolia')).toEqual(UniverseChainId.UnichainSepolia)
    expect(fromUniswapWebAppLink('astrochain_sepolia')).toEqual(UniverseChainId.UnichainSepolia)
  })

  it('handle unsupported chain', () => {
    expect(() => fromUniswapWebAppLink('unkwnown')).toThrow('Network "unkwnown" can not be mapped')
  })
})

describe(toUniswapWebAppLink, () => {
  it('handles supported chain', () => {
    expect(toUniswapWebAppLink(UniverseChainId.Mainnet)).toEqual('ethereum')
    expect(toUniswapWebAppLink(UniverseChainId.ArbitrumOne)).toEqual('arbitrum')
    expect(toUniswapWebAppLink(UniverseChainId.Optimism)).toEqual('optimism')
    expect(toUniswapWebAppLink(UniverseChainId.Polygon)).toEqual('polygon')
    expect(toUniswapWebAppLink(UniverseChainId.MegaETH)).toEqual('megaeth')
    expect(toUniswapWebAppLink(UniverseChainId.Base)).toEqual('base')
    expect(toUniswapWebAppLink(UniverseChainId.UnichainSepolia)).toEqual('unichain_sepolia')
  })

  it('round-trips every chain', () => {
    for (const chainId of ALL_CHAIN_IDS) {
      expect(fromUniswapWebAppLink(toUniswapWebAppLink(chainId))).toEqual(chainId)
    }
  })
})

describe(chainIdToHexadecimalString, () => {
  it('handles supported chain', () => {
    expect(chainIdToHexadecimalString(UniverseChainId.ArbitrumOne)).toEqual('0xa4b1')
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

describe('getEnabledChains', () => {
  it('returns all mainnet chains', () => {
    expect(
      getEnabledChains({ appId: AppId.Web, isTestnetModeEnabled: false, featureFlaggedChainIds: ALL_CHAIN_IDS }),
    ).toEqual({
      chains: [
        UniverseChainId.Mainnet,
        UniverseChainId.Unichain,
        UniverseChainId.Monad,
        UniverseChainId.Solana,
        UniverseChainId.Polygon,
        UniverseChainId.ArbitrumOne,
        UniverseChainId.Optimism,
        UniverseChainId.Base,
        UniverseChainId.Bnb,
        UniverseChainId.Avalanche,
        UniverseChainId.Celo,
        UniverseChainId.WorldChain,
        UniverseChainId.Linea,
        UniverseChainId.MegaETH,
        UniverseChainId.Robinhood,
        UniverseChainId.Arc,
        UniverseChainId.Ink,
        UniverseChainId.Elysium,
        UniverseChainId.Soneium,
        UniverseChainId.Tempo,
        UniverseChainId.XLayer,
        UniverseChainId.Zora,
        UniverseChainId.Zksync,
      ],
      defaultChainId: UniverseChainId.Mainnet,
      isTestnetModeEnabled: false,
    })
  })

  it('returns feature flagged chains', () => {
    expect(
      getEnabledChains({
        appId: AppId.Web,
        isTestnetModeEnabled: false,
        featureFlaggedChainIds: [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      }),
    ).toEqual({
      chains: [UniverseChainId.Mainnet, UniverseChainId.Polygon],
      defaultChainId: UniverseChainId.Mainnet,
      isTestnetModeEnabled: false,
    })
  })

  it('returns testnet chains', () => {
    expect(
      getEnabledChains({
        appId: AppId.Web,
        isTestnetModeEnabled: true,
        featureFlaggedChainIds: ALL_CHAIN_IDS,
      }),
    ).toEqual({
      chains: [UniverseChainId.Sepolia, UniverseChainId.UnichainSepolia],
      defaultChainId: UniverseChainId.Sepolia,
      isTestnetModeEnabled: true,
    })
  })

  it('returns both mainnet and testnet chains when includeTestnets is true', () => {
    expect(
      getEnabledChains({
        appId: AppId.Web,
        includeTestnets: true,
        isTestnetModeEnabled: false,
        featureFlaggedChainIds: [
          UniverseChainId.Mainnet,
          UniverseChainId.Unichain,
          UniverseChainId.Base,
          UniverseChainId.Sepolia,
          UniverseChainId.UnichainSepolia,
        ],
      }),
    ).toEqual({
      chains: [
        UniverseChainId.Mainnet,
        UniverseChainId.Unichain,
        UniverseChainId.Base,
        UniverseChainId.Sepolia,
        UniverseChainId.UnichainSepolia,
      ],
      defaultChainId: UniverseChainId.Mainnet,
      isTestnetModeEnabled: false,
    })
  })
})
