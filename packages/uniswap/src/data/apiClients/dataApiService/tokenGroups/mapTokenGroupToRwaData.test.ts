import type { PartialMessage } from '@bufbuild/protobuf'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GetTokenGroupResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { UniverseChainId } from '@universe/chains'
import { mapTokenGroupToRwaData } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapTokenGroupToRwaData'
import { UNKNOWN_RWA_ISSUER } from 'uniswap/src/features/rwa/types'
import { rwaTokenMarketDataKey } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'

const ENABLED_CHAIN_IDS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.Bnb]
const ONDO_MAINNET = '0xAA20000000000000000000000000000000000102'
const ONDO_BNB = '0xAA20000000000000000000000000000000000202'
const XSTOCKS_ADDRESS = '0xAA10000000000000000000000000000000000101'
const ROBINHOOD_CHAIN_ID = 4663

function makeResponse(overrides?: PartialMessage<GetTokenGroupResponse>): GetTokenGroupResponse {
  return new GetTokenGroupResponse({
    group: {
      id: 'tsla',
      displayName: 'Tesla',
      ticker: 'TSLA',
      categoryId: 'stocks',
      logoUrl: 'https://example.com/tsla.png',
    },
    stats: { price: 327.24, volume1d: 7_107_400 },
    priceDeviationPct: 0.16,
    members: [
      {
        multichainToken: {
          symbol: 'TSLAX',
          name: 'Tesla xStock',
          addresses: {
            [UniverseChainId.Base]: XSTOCKS_ADDRESS,
            [UniverseChainId.Mainnet]: XSTOCKS_ADDRESS,
            [UniverseChainId.Bnb]: XSTOCKS_ADDRESS,
          },
          issuer: { id: 'xstocks', displayName: 'xStocks (Backed Finance)', logoUrl: 'https://example.com/x.png' },
          price: { spotUsd: 327.24, percentChange1d: 2.31 },
        },
        stats: { marketCap: 13_400_000, volume1d: 2_900_000 },
      },
      {
        multichainToken: {
          symbol: 'TSLAON',
          name: 'Ondo Tokenized Tesla',
          addresses: { [UniverseChainId.Mainnet]: ONDO_MAINNET, [UniverseChainId.Bnb]: ONDO_BNB },
          issuer: { id: 'ondo', displayName: 'Ondo', logoUrl: 'https://example.com/ondo.png' },
          price: { spotUsd: 327.53 },
        },
        stats: { marketCap: 15_400_000, volume1d: 2_500_000 },
      },
      {
        multichainToken: {
          symbol: 'TSLA',
          name: 'Tesla Stock Token',
          addresses: { [ROBINHOOD_CHAIN_ID]: '0xAA30000000000000000000000000000000000103' },
          issuer: { id: 'robinhood', displayName: 'Robinhood', logoUrl: '' },
          price: { spotUsd: 327.77 },
        },
        stats: { marketCap: 1_600_000, volume1d: 756_300 },
      },
    ],
    ...overrides,
  })
}

const ONDO_SUBJECT = { chainId: UniverseChainId.Mainnet, address: ONDO_MAINNET.toLowerCase() }

describe(mapTokenGroupToRwaData, () => {
  it('maps the group onto the RWA asset shape with its category', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.rwaMatch.asset).toMatchObject({
      symbol: 'TSLA',
      name: 'Tesla',
      icon: 'https://example.com/tsla.png',
      category: RwaCategory.STOCKS,
    })
  })

  it('matches the subject member by address, case-insensitively, on its own leg', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.rwaMatch.token).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: ONDO_MAINNET,
      issuer: 'ondo',
      issuerDisplayName: 'Ondo',
      issuerLogoUrl: 'https://example.com/ondo.png',
      symbol: 'TSLAON',
      name: 'Ondo Tokenized Tesla',
      networkCount: 2,
    })
  })

  it('keeps the subject on the leg the page is on, not the mainnet-first pick', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: { chainId: UniverseChainId.Bnb, address: ONDO_BNB },
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.rwaMatch.token).toMatchObject({ chainId: UniverseChainId.Bnb, address: ONDO_BNB })
  })

  it('excludes only the subject member from the siblings, in backend order', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.otherIssuerTokens.map((token) => token.symbol)).toEqual(['TSLAX'])
    expect(data?.rwaMatch.asset.tokens).toHaveLength(2)
  })

  it('picks the mainnet-first enabled leg for siblings and counts enabled legs', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: [UniverseChainId.Base, UniverseChainId.Mainnet],
    })

    expect(data?.otherIssuerTokens[0]).toMatchObject({
      chainId: UniverseChainId.Mainnet,
      address: XSTOCKS_ADDRESS,
      networkCount: 2,
    })
  })

  it('drops members with no leg on an enabled chain', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.rwaMatch.asset.tokens.map((token) => token.issuer)).not.toContain('robinhood')
  })

  it('falls back to the group logo when the member has no project logo', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.rwaMatch.token.logoUrl).toBe('https://example.com/tsla.png')
  })

  it('keeps unknown-issuer members under the unknown slug with no display name', () => {
    const response = makeResponse({
      members: [
        {
          multichainToken: {
            symbol: 'XAGT',
            name: 'Tether Silver',
            addresses: { [UniverseChainId.Mainnet]: '0xEE10000000000000000000000000000000000501' },
            price: { spotUsd: 38.14 },
          },
          stats: { marketCap: 41_000_000, volume1d: 640_000 },
        },
      ],
    })

    const data = mapTokenGroupToRwaData({
      response,
      subject: { chainId: UniverseChainId.Mainnet, address: '0xEE10000000000000000000000000000000000501' },
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data?.rwaMatch.token).toMatchObject({ issuer: UNKNOWN_RWA_ISSUER, issuerDisplayName: undefined })
    expect(data?.otherIssuerTokens).toEqual([])
  })

  it('exposes card stats per member, price from the token and the rest from member stats', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: ENABLED_CHAIN_IDS,
    })
    const xstocks = data?.otherIssuerTokens[0]

    expect(data && xstocks && data.marketDataByToken.get(rwaTokenMarketDataKey(xstocks))).toEqual({
      priceUsd: 327.24,
      marketCapUsd: 13_400_000,
      volume24hUsd: 2_900_000,
    })
  })

  it('returns undefined when no member carries the subject leg', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: { chainId: UniverseChainId.Mainnet, address: '0x0000000000000000000000000000000000000001' },
      enabledChainIds: ENABLED_CHAIN_IDS,
    })

    expect(data).toBeUndefined()
  })

  it('keeps the subject on its own leg even when that chain is not enabled', () => {
    const data = mapTokenGroupToRwaData({
      response: makeResponse(),
      subject: ONDO_SUBJECT,
      enabledChainIds: [UniverseChainId.Polygon],
    })

    expect(data?.rwaMatch.token).toMatchObject({ chainId: UniverseChainId.Mainnet, address: ONDO_MAINNET })
    expect(data?.otherIssuerTokens).toEqual([])
  })

  it('returns undefined for a group without a ticker', () => {
    expect(
      mapTokenGroupToRwaData({
        response: makeResponse({ group: { id: 'x', displayName: 'X', ticker: '' } }),
        subject: ONDO_SUBJECT,
        enabledChainIds: ENABLED_CHAIN_IDS,
      }),
    ).toBeUndefined()
  })
})
