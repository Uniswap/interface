import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { DEFAULT_NATIVE_ADDRESS as NATIVE_ADDRESS } from '@universe/prices'
import { USDT } from 'uniswap/src/constants/tokens'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { buildNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'
import {
  buildTokenPricesResponse,
  buildTokenProjectsFallbackResponse,
  fallbackPriceForToken,
  isGraphqlResponseHealthy,
  parseLiveTokenPrices,
  type TokenPriceRequest,
} from '~/playwright/fixtures/tokenDataFallbacks'

// Real mainnet prices as the live price service returned them while the limit specs were failing
// on run 34530086987, kept alongside that run's measured market price below
const LIVE_ETH_USD = 2459.012137367723
const LIVE_USDT_USD = 0.9997835334926242
const LIVE_UPDATED_AT = '2026-09-10T21:43:05.699Z'
const FALLBACK_UPDATED_AT = '2026-09-10T21:50:00.000Z'

describe('buildTokenProjectsFallbackResponse', () => {
  it('serves known contracts with production decimals', () => {
    const response = buildTokenProjectsFallbackResponse([
      currencyIdToContractInput(buildNativeCurrencyId(UniverseChainId.Mainnet)),
      currencyIdToContractInput(currencyId(USDT)),
    ])

    const tokens = response.data.tokenProjects.flatMap((project) => project.tokens)

    const eth = tokens.find((token) => token.standard === GraphQLApi.TokenStandard.Native)
    expect(eth?.chain).toBe(GraphQLApi.Chain.Ethereum)
    expect(eth?.decimals).toBe(18)

    const usdt = tokens.find((token) => token.symbol === 'USDT')
    // The exact bug class this map exists to prevent: a guessed decimals value (18) would make
    // the app silently mis-scale USDT amounts
    expect(usdt?.decimals).toBe(6)
    expect(usdt?.address?.toLowerCase()).toBe(USDT.address.toLowerCase())
  })

  it('omits unknown contracts instead of guessing metadata', () => {
    const response = buildTokenProjectsFallbackResponse([
      currencyIdToContractInput(currencyId(USDT)),
      { chain: 'ETHEREUM', address: '0x1111111111111111111111111111111111111111' },
    ])

    expect(response.data.tokenProjects).toHaveLength(1)
    expect(response.data.tokenProjects[0]?.tokens[0]?.symbol).toBe('USDT')
  })
})

describe('isGraphqlResponseHealthy', () => {
  type HealthCheckResponse = Parameters<typeof isGraphqlResponseHealthy>[0]

  function stubResponse({ ok, body }: { ok: boolean; body: string }): HealthCheckResponse {
    return {
      ok: () => ok,
      json: async () => JSON.parse(body) as unknown,
    } as unknown as HealthCheckResponse
  }

  it('accepts a 2xx with data and no errors', async () => {
    const body = JSON.stringify({ data: { tokens: [] } })
    await expect(isGraphqlResponseHealthy(stubResponse({ ok: true, body }))).resolves.toBe(true)
  })

  it('accepts a 2xx with an empty errors array', async () => {
    const body = JSON.stringify({ data: { tokens: [] }, errors: [] })
    await expect(isGraphqlResponseHealthy(stubResponse({ ok: true, body }))).resolves.toBe(true)
  })

  it('rejects a non-2xx response', async () => {
    const body = JSON.stringify({ data: { tokens: [] } })
    await expect(isGraphqlResponseHealthy(stubResponse({ ok: false, body }))).resolves.toBe(false)
  })

  // The throttle shape the retry targets besides a bare 429: the gateway answering 200 with errors
  it('rejects a 2xx carrying GraphQL errors', async () => {
    const body = JSON.stringify({ data: null, errors: [{ message: 'rate limited' }] })
    await expect(isGraphqlResponseHealthy(stubResponse({ ok: true, body }))).resolves.toBe(false)
  })

  it('rejects a 2xx whose body does not parse', async () => {
    await expect(isGraphqlResponseHealthy(stubResponse({ ok: true, body: 'not json' }))).resolves.toBe(false)
  })
})

describe('parseLiveTokenPrices', () => {
  it('keeps entries carrying a finite, positive price', () => {
    const prices = parseLiveTokenPrices({
      tokenPrices: [{ chainId: 1, address: NATIVE_ADDRESS, priceUsd: 2459.01, updatedAt: LIVE_UPDATED_AT }],
    })

    expect(prices).toHaveLength(1)
    expect(prices[0]?.priceUsd).toBe(2459.01)
  })

  // A price the app cannot convert with is no better than a missing one: usePrice never resolves
  // and the limit form's cross-check skips a zero rather than validating against it
  it.each([
    ['zero', 0],
    ['negative', -1],
    ['not a number', 'cheap'],
    ['null', null],
    ['missing', undefined],
  ])('drops a %s price', (_label, priceUsd) => {
    expect(
      parseLiveTokenPrices({ tokenPrices: [{ chainId: 1, address: NATIVE_ADDRESS, priceUsd, updatedAt: '' }] }),
    ).toHaveLength(0)
  })

  it.each([
    ['a body that is not an object', 'not json'],
    ['a body with no tokenPrices', {}],
    ['a tokenPrices that is not an array', { tokenPrices: { chainId: 1 } }],
    ['a null body', null],
  ])('yields nothing for %s', (_label, body) => {
    expect(parseLiveTokenPrices(body)).toEqual([])
  })
})

describe('buildTokenPricesResponse', () => {
  const requestedTokens: TokenPriceRequest[] = [
    { chainId: UniverseChainId.Mainnet, address: USDT.address },
    { chainId: UniverseChainId.Mainnet, address: NATIVE_ADDRESS },
  ]

  function priceFor(response: ReturnType<typeof buildTokenPricesResponse>, address: string): number | undefined {
    return response.tokenPrices.find((price) => price.address === address)?.priceUsd
  }

  it('serves the live price, matching the request address case-insensitively', () => {
    const response = buildTokenPricesResponse({
      requestedTokens,
      // The gateway echoes lowercase addresses; the request carries checksummed ones
      livePrices: parseLiveTokenPrices({
        tokenPrices: [
          { chainId: 1, address: USDT.address.toLowerCase(), priceUsd: LIVE_USDT_USD, updatedAt: LIVE_UPDATED_AT },
          { chainId: 1, address: NATIVE_ADDRESS, priceUsd: LIVE_ETH_USD, updatedAt: LIVE_UPDATED_AT },
        ],
      }),
      updatedAt: FALLBACK_UPDATED_AT,
    })

    expect(priceFor(response, USDT.address)).toBe(LIVE_USDT_USD)
    expect(priceFor(response, NATIVE_ADDRESS)).toBe(LIVE_ETH_USD)
    expect(response.tokenPrices[0]?.updatedAt).toBe(LIVE_UPDATED_AT)
  })

  // Per-token rather than all-or-nothing: one unpriced long-tail token must not drag the majors
  // requested alongside it back onto constants, which is what breaks the limit cross-check
  it('falls back only for the tokens the live service did not price', () => {
    const response = buildTokenPricesResponse({
      requestedTokens,
      livePrices: parseLiveTokenPrices({
        tokenPrices: [{ chainId: 1, address: NATIVE_ADDRESS, priceUsd: LIVE_ETH_USD, updatedAt: LIVE_UPDATED_AT }],
      }),
      updatedAt: FALLBACK_UPDATED_AT,
    })

    expect(priceFor(response, NATIVE_ADDRESS)).toBe(LIVE_ETH_USD)
    expect(priceFor(response, USDT.address)).toBe(fallbackPriceForToken(USDT.address))
  })

  it('answers every requested token from the fallback anchors when nothing live is usable', () => {
    const response = buildTokenPricesResponse({ requestedTokens, livePrices: [], updatedAt: FALLBACK_UPDATED_AT })

    expect(response.tokenPrices).toHaveLength(requestedTokens.length)
    expect(priceFor(response, NATIVE_ADDRESS)).toBe(fallbackPriceForToken(NATIVE_ADDRESS))
    expect(priceFor(response, USDT.address)).toBe(fallbackPriceForToken(USDT.address))
    expect(response.tokenPrices.every((price) => price.priceUsd > 0)).toBe(true)
    expect(response.tokenPrices[0]?.updatedAt).toBe(FALLBACK_UPDATED_AT)
  })

  /**
   * The regression this route's live-first shape exists for. The limit form cross-checks its
   * market-price reference against the ratio of the two tokens' USD prices and rejects the
   * reference — disabling the Market/+1%/+5%/+10% presets and the whole form — when they diverge
   * by more than MAX_MARKET_PRICE_USD_SPOT_DEVIATION (limitMarketPrice.ts). /quote is served live
   * in the anvil suite, so the prices this route serves have to track the same market. Numbers are
   * the measured ones from the run the limit specs failed on (34530086987).
   */
  describe('USD ratio against the market price the live /quote reported', () => {
    // The reference leg quoted 100 USDT -> 40608372790732623 wei, i.e. ~2462.55 USDT per ETH.
    // Truncated to a literal a double holds exactly; a 10% gate needs nowhere near that precision.
    const MARKET_ETH_PER_USDT = 4.060837279e-4
    const MAX_SPOT_DEVIATION = 0.1

    function deviationFromMarket({ usdtUsd, ethUsd }: { usdtUsd: number; ethUsd: number }): number {
      const impliedEthPerUsdt = usdtUsd / ethUsd
      return Math.abs(MARKET_ETH_PER_USDT - impliedEthPerUsdt) / impliedEthPerUsdt
    }

    it('stays inside the gate on live prices', () => {
      const response = buildTokenPricesResponse({
        requestedTokens,
        livePrices: parseLiveTokenPrices({
          tokenPrices: [
            { chainId: 1, address: USDT.address.toLowerCase(), priceUsd: LIVE_USDT_USD, updatedAt: LIVE_UPDATED_AT },
            { chainId: 1, address: NATIVE_ADDRESS, priceUsd: LIVE_ETH_USD, updatedAt: LIVE_UPDATED_AT },
          ],
        }),
        updatedAt: FALLBACK_UPDATED_AT,
      })

      const deviation = deviationFromMarket({
        usdtUsd: priceFor(response, USDT.address) ?? 0,
        ethUsd: priceFor(response, NATIVE_ADDRESS) ?? 0,
      })

      expect(deviation).toBeLessThan(MAX_SPOT_DEVIATION)
    })

    // Why a constant cannot serve this route: the anchors were pinned when ETH was ~$3000 and the
    // market moved 20%+ away, which is what disabled the limit form in CI
    it('shows why the fallback anchors alone cannot: they exceed the gate', () => {
      const deviation = deviationFromMarket({
        usdtUsd: fallbackPriceForToken(USDT.address),
        ethUsd: fallbackPriceForToken(NATIVE_ADDRESS),
      })

      expect(deviation).toBeGreaterThan(MAX_SPOT_DEVIATION)
    })
  })
})
