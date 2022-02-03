import { Currency } from '@uniswap/sdk-core'
import { filter } from 'src/components/CurrencySelector/util'
import { ChainId } from 'src/constants/chains'
import { DAI, DAI_ARBITRUM_ONE } from 'src/constants/tokens'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'

const ETH = NativeCurrency.onChain(ChainId.Mainnet)

const TEST_TOKEN_INPUT: Currency[] = [DAI, ETH, DAI_ARBITRUM_ONE]

describe(filter, () => {
  it('returns the entire input flattened if chainFilter and searchFilter are null', () => {
    expect(filter(TEST_TOKEN_INPUT, null, null)).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
    expect(filter(TEST_TOKEN_INPUT, null, '')).toEqual([DAI, ETH, DAI_ARBITRUM_ONE])
  })

  it('filters by single chain', () => {
    expect(filter(TEST_TOKEN_INPUT, ChainId.Mainnet, null)).toEqual([DAI, ETH])
  })

  it('filters by partial token symbol', () => {
    expect(filter(TEST_TOKEN_INPUT, null, 'D')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filter(TEST_TOKEN_INPUT, null, 'DA')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filter(TEST_TOKEN_INPUT, null, 'DAI')).toEqual([DAI, DAI_ARBITRUM_ONE])
    expect(filter(TEST_TOKEN_INPUT, null, 'ETH')).toEqual([ETH])
  })

  it('ignores token symbol when no match', () => {
    expect(filter(TEST_TOKEN_INPUT, null, 'DAI2')).toEqual([])
  })

  it('filters by first characters of token address', () => {
    expect(filter(TEST_TOKEN_INPUT, null, DAI.address)).toEqual([DAI])
    expect(filter(TEST_TOKEN_INPUT, null, DAI.address.slice(0, 10))).toEqual([DAI])
    expect(filter(TEST_TOKEN_INPUT, null, '0x')).toEqual([DAI, DAI_ARBITRUM_ONE])
  })

  it('ignores non-first characters of token address', () => {
    expect(filter(TEST_TOKEN_INPUT, null, DAI.address.slice(3, 6))).toEqual([])
    expect(filter(TEST_TOKEN_INPUT, null, DAI.address.slice(10, -1))).toEqual([])
  })

  it('filters by chainFilter and searchFilter', () => {
    expect(filter(TEST_TOKEN_INPUT, ChainId.Mainnet, 'DA')).toEqual([DAI])
    expect(filter(TEST_TOKEN_INPUT, ChainId.Mainnet, DAI.address)).toEqual([DAI])
    expect(filter(TEST_TOKEN_INPUT, ChainId.ArbitrumOne, 'DAI')).toEqual([DAI_ARBITRUM_ONE])
    expect(filter(TEST_TOKEN_INPUT, ChainId.ArbitrumOne, DAI_ARBITRUM_ONE.address)).toEqual([
      DAI_ARBITRUM_ONE,
    ])
  })
})
