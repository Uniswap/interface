import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { multichainSearchResultsToOptions } from 'uniswap/src/components/TokenSelector/hooks/useMultichainSearchResultsToOptions'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, MultichainSearchResult } from 'uniswap/src/features/dataApi/types'

function createCurrencyInfo(overrides?: Partial<CurrencyInfo>): CurrencyInfo {
  const currency = new Token(
    UniverseChainId.Mainnet,
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    6,
    'USDC',
    'USD Coin',
  )
  return {
    currency,
    currencyId: `${UniverseChainId.Mainnet}-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`,
    logoUrl: 'https://example.com/usdc.png',
    safetyLevel: undefined,
    safetyInfo: undefined,
    isSpam: false,
    ...overrides,
  } as CurrencyInfo
}

function createMultichainSearchResult(overrides?: Partial<MultichainSearchResult>): MultichainSearchResult {
  return {
    id: 'usdc-multichain-id',
    name: 'USD Coin',
    symbol: 'USDC',
    logoUrl: 'https://example.com/usdc.png',
    tokens: [
      createCurrencyInfo(),
      createCurrencyInfo({
        currency: new Token(
          UniverseChainId.ArbitrumOne,
          '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          6,
          'USDC',
          'USD Coin',
        ),
        currencyId: `${UniverseChainId.ArbitrumOne}-0xaf88d065e77c8cC2239327C5EDb3A432268e5831`,
      }),
    ],
    ...overrides,
  }
}

describe('multichainSearchResultsToOptions', () => {
  it('should return undefined when results are undefined', () => {
    expect(multichainSearchResultsToOptions(undefined)).toBeUndefined()
  })

  it('should return empty array for empty results', () => {
    expect(multichainSearchResultsToOptions([])).toEqual([])
  })

  it('should convert multichain results to MultichainTokenOption[]', () => {
    const results = [createMultichainSearchResult()]
    const options = multichainSearchResultsToOptions(results)

    expect(options).toHaveLength(1)
    expect(options![0]!.type).toBe(OnchainItemListOptionType.MultichainToken)
    expect(options![0]!.multichainResult).toBe(results[0])
    expect(options![0]!.primaryCurrencyInfo).toBe(results[0]!.tokens[0])
  })

  it('should use the first token as primaryCurrencyInfo', () => {
    const results = [createMultichainSearchResult()]
    const options = multichainSearchResultsToOptions(results)

    expect(options![0]!.primaryCurrencyInfo.currency.chainId).toBe(UniverseChainId.Mainnet)
  })

  it('should filter out results with no tokens', () => {
    const results = [createMultichainSearchResult(), createMultichainSearchResult({ id: 'empty', tokens: [] })]
    const options = multichainSearchResultsToOptions(results)

    expect(options).toHaveLength(1)
    expect(options![0]!.multichainResult.id).toBe('usdc-multichain-id')
  })

  it('should handle multiple multichain results', () => {
    const results = [
      createMultichainSearchResult({ id: 'usdc', symbol: 'USDC' }),
      createMultichainSearchResult({ id: 'usdt', symbol: 'USDT' }),
    ]
    const options = multichainSearchResultsToOptions(results)

    expect(options).toHaveLength(2)
    expect(options![0]!.multichainResult.symbol).toBe('USDC')
    expect(options![1]!.multichainResult.symbol).toBe('USDT')
  })
})
