import type { JsonValue } from '@bufbuild/protobuf'
import { TokenRankingsResponse } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { CustomRankingType, GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { USDT } from 'uniswap/src/constants/tokens'
import { tokenRankingsStatToCurrencyInfo } from 'uniswap/src/data/apiClients/dataApiService/exploreV1/tokenRankings'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { buildNativeCurrencyId, currencyId } from 'uniswap/src/utils/currencyId'
import { describe, expect, it } from 'vitest'
import {
  buildTokenProjectsFallbackResponse,
  buildTokenRankingsFallbackResponse,
  isGraphqlResponseHealthy,
  isTokenRankingsResponseHealthy,
} from '~/playwright/fixtures/tokenDataFallbacks'

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

describe('buildTokenRankingsFallbackResponse', () => {
  it('produces valid proto3 JSON with a non-empty trending list containing mainnet ETH and USDT', () => {
    const json = buildTokenRankingsFallbackResponse('ALL_NETWORKS')

    // fromJson throws on any field the generated message does not know, pinning the shape
    const parsed = TokenRankingsResponse.fromJson(json as unknown as JsonValue)
    const trending = parsed.tokenRankings[CustomRankingType.Trending]
    expect(trending.tokens.length).toBeGreaterThan(0)

    const currencyInfos = trending.tokens.map(tokenRankingsStatToCurrencyInfo).filter((info) => info !== null)
    expect(currencyInfos.length).toBe(trending.tokens.length)

    const eth = currencyInfos.find((info) => info.currency.isNative)
    expect(eth?.currency.chainId).toBe(UniverseChainId.Mainnet)

    const usdt = currencyInfos.find((info) => info.currency.symbol === 'USDT')
    expect(usdt?.currency.decimals).toBe(6)
  })

  it('scopes chain-filtered requests to that chain', () => {
    const json = buildTokenRankingsFallbackResponse(String(UniverseChainId.Polygon))

    const parsed = TokenRankingsResponse.fromJson(json as unknown as JsonValue)
    const trending = parsed.tokenRankings[CustomRankingType.Trending]
    const currencyInfos = trending.tokens.map(tokenRankingsStatToCurrencyInfo).filter((info) => info !== null)

    expect(currencyInfos.length).toBeGreaterThan(0)
    expect(currencyInfos.every((info) => info.currency.chainId === UniverseChainId.Polygon)).toBe(true)
  })
})

describe('isTokenRankingsResponseHealthy', () => {
  type HealthCheckResponse = Parameters<typeof isTokenRankingsResponseHealthy>[0]

  function stubResponse({ ok, body }: { ok: boolean; body: string }): HealthCheckResponse {
    return {
      ok: () => ok,
      json: async () => JSON.parse(body) as unknown,
    } as unknown as HealthCheckResponse
  }

  it('accepts a 2xx with a non-empty ranking list', async () => {
    const body = JSON.stringify(buildTokenRankingsFallbackResponse('ALL_NETWORKS'))
    await expect(isTokenRankingsResponseHealthy(stubResponse({ ok: true, body }))).resolves.toBe(true)
  })

  it('rejects a non-2xx response', async () => {
    const body = JSON.stringify(buildTokenRankingsFallbackResponse('ALL_NETWORKS'))
    await expect(isTokenRankingsResponseHealthy(stubResponse({ ok: false, body }))).resolves.toBe(false)
  })

  // The failure mode the fallback exists for: gateway throttling surfacing as a 2xx whose
  // trending list is empty still unmounts the section headers the specs target
  it('rejects a 2xx whose ranking lists are all empty', async () => {
    const body = JSON.stringify({ tokenRankings: { [CustomRankingType.Trending]: { tokens: [] } } })
    await expect(isTokenRankingsResponseHealthy(stubResponse({ ok: true, body }))).resolves.toBe(false)
  })

  it('rejects a 2xx with no tokenRankings map', async () => {
    await expect(isTokenRankingsResponseHealthy(stubResponse({ ok: true, body: '{}' }))).resolves.toBe(false)
  })

  it('rejects a 2xx whose body does not parse', async () => {
    await expect(isTokenRankingsResponseHealthy(stubResponse({ ok: true, body: 'not json' }))).resolves.toBe(false)
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
