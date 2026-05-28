import {
  TokenRankingsResponse,
  TokenRankingsStat,
  ChainToken,
  TokenRankingsList,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { canonicalizeFavorites } from 'uniswap/src/features/favorites/hooks/useCanonicalFavoritesMigration'

function makeChainToken(chainId: number, address: string): ChainToken {
  return { chainId, address, decimals: 18 } as unknown as ChainToken
}

function makeStat(chain: string, address: string, chainTokens: ChainToken[]): TokenRankingsStat {
  return { chain, address, chainTokens } as unknown as TokenRankingsStat
}

function makeResponse(tokens: TokenRankingsStat[]): TokenRankingsResponse {
  return {
    tokenRankings: {
      VOLUME: { tokens } as unknown as TokenRankingsList,
    },
  } as unknown as TokenRankingsResponse
}

describe(canonicalizeFavorites, () => {
  it('dedupes same-address tokens across chains', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xAAA', [
        makeChainToken(1, '0xAAA'),
        makeChainToken(42161, '0xAAA'),
        makeChainToken(8453, '0xAAA'),
      ]),
    ])

    const result = canonicalizeFavorites(['1-0xAAA', '42161-0xAAA', '8453-0xAAA'], response)
    expect(result).toEqual(['1-0xAAA'])
  })

  it('dedupes different-address tokens that share the same project (e.g. USDC)', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', [
        makeChainToken(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        makeChainToken(42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
        makeChainToken(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
      ]),
    ])

    const result = canonicalizeFavorites(
      ['42161-0xaf88d065e77c8cC2239327C5EDb3A432268e5831', '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
      response,
    )

    // Both map to the same canonical mainnet entry. Canonical ids are normalized to lowercase.
    expect(result).toEqual(['1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'])
  })

  it('canonicalizes non-mainnet favorite to mainnet', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xAAA', [makeChainToken(1, '0xAAA'), makeChainToken(42161, '0xAAA')]),
    ])

    const result = canonicalizeFavorites(['42161-0xAAA'], response)
    expect(result).toEqual(['1-0xAAA'])
  })

  it('keeps favorites not found in rankings as-is', () => {
    const response = makeResponse([makeStat('ETHEREUM', '0xAAA', [makeChainToken(1, '0xAAA')])])

    const result = canonicalizeFavorites(['1-0xAAA', '1-0xUnknown'], response)
    expect(result).toEqual(['1-0xAAA', '1-0xUnknown'])
  })

  it('handles multiple distinct tokens', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xUSDC', [makeChainToken(1, '0xUSDC'), makeChainToken(42161, '0xUSDC_ARB')]),
      makeStat('ETHEREUM', '0xWBTC', [makeChainToken(1, '0xWBTC')]),
    ])

    const result = canonicalizeFavorites(['42161-0xUSDC_ARB', '1-0xWBTC', '1-0xUSDC'], response)

    // USDC_ARB → canonical 0xUSDC, then 0xUSDC deduped. WBTC kept.
    expect(result).toEqual(['1-0xUSDC', '1-0xWBTC'])
  })

  it('handles empty favorites', () => {
    const response = makeResponse([])
    expect(canonicalizeFavorites([], response)).toEqual([])
  })

  it('handles empty rankings response', () => {
    const response = { tokenRankings: {} } as TokenRankingsResponse
    const result = canonicalizeFavorites(['1-0xAAA', '42161-0xBBB'], response)
    expect(result).toEqual(['1-0xAAA', '42161-0xBBB'])
  })

  it('skips tokens with undefined chainTokens without crashing', () => {
    const response = makeResponse([
      { chain: 'ETHEREUM', address: '0xAAA', chainTokens: undefined } as unknown as TokenRankingsStat,
      makeStat('ETHEREUM', '0xBBB', [makeChainToken(1, '0xBBB')]),
    ])

    const result = canonicalizeFavorites(['1-0xAAA', '1-0xBBB'], response)
    expect(result).toEqual(['1-0xAAA', '1-0xBBB'])
  })

  it('matches addresses case-insensitively', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xaaa', [makeChainToken(1, '0xaaa'), makeChainToken(42161, '0xAAA')]),
    ])

    const result = canonicalizeFavorites(['42161-0xAAA', '1-0xaaa'], response)
    expect(result).toEqual(['1-0xaaa'])
  })
})
