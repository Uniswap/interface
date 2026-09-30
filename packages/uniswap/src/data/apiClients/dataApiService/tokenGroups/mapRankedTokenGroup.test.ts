import type { PartialMessage } from '@bufbuild/protobuf'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ListTokenGroupsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { RankedTokenGroup } from '@uniswap/client-data-api/dist/data/v2/tokenGroups_pb'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import {
  mapRankedTokenGroup,
  mapRankedTokenGroupList,
} from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/mapRankedTokenGroup'

function makeRankedTokenGroup(overrides?: PartialMessage<RankedTokenGroup>): RankedTokenGroup {
  return new RankedTokenGroup({
    group: {
      id: 'tsla',
      displayName: 'Tesla',
      ticker: 'TSLA',
      categoryId: 'stocks',
      logoUrl: 'https://example.com/tsla.png',
    },
    stats: { price: 248.42, priceChange1h: 0.12, priceChange1d: 1.31, marketCap: 44_200_000, volume1d: 12_400_000 },
    priceDeviationPct: 0.4,
    members: [
      {
        multichainToken: {
          symbol: 'TSLAON',
          name: 'Tesla (Ondo)',
          addresses: { [UniverseChainId.Base]: '0xondo-base', [UniverseChainId.Mainnet]: '0xondo-mainnet' },
          project: { logoUrl: 'https://example.com/tslaon.png' },
          issuer: { id: 'ondo', displayName: 'Ondo', logoUrl: '' },
          price: { spotUsd: 247.9, percentChange1h: 0.1, percentChange1d: 1.3 },
        },
        // Member stats carry no price; that lives on multichainToken.price (see StubTokenGroupsBL).
        stats: { marketCap: 22_000_000, volume1d: 8_000_000 },
        sparkline: [
          { timestamp: BigInt(1_700_000_000), value: 245 },
          { timestamp: BigInt(1_700_003_600), value: 248.42 },
        ],
      },
    ],
    ...overrides,
  })
}

describe('mapRankedTokenGroup', () => {
  it('maps a ranked group and its members onto the Rwa row shape', () => {
    const rwa = mapRankedTokenGroup({
      rankedGroup: makeRankedTokenGroup(),
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rwa).toMatchObject({
      symbol: 'TSLA',
      name: 'Tesla',
      logoUrl: 'https://example.com/tsla.png',
      priceUsd: 248.42,
      priceChange1hPct: 0.12,
      priceChange24hPct: 1.31,
      marketCapUsd: 44_200_000,
      volume24hUsd: 12_400_000,
      priceDeviationPct: 0.4,
      categories: [RwaCategory.STOCKS],
    })
    expect(rwa?.issuerTokens).toHaveLength(1)
    expect(rwa?.issuerTokens[0]).toMatchObject({
      symbol: 'TSLAON',
      name: 'Tesla (Ondo)',
      logoUrl: 'https://example.com/tslaon.png',
      issuer: 'ondo',
      issuerDisplayName: 'Ondo',
      priceUsd: 247.9,
      priceChange1hPct: 0.1,
      priceChange24hPct: 1.3,
      volume24hUsd: 8_000_000,
      marketCapUsd: 22_000_000,
    })
    expect(rwa?.issuerTokens[0]?.sparkline1d.points).toEqual([
      { timestampS: 1_700_000_000, value: 245 },
      { timestampS: 1_700_003_600, value: 248.42 },
    ])
  })

  it('reads the volume window the list was ranked by on the group and its members', () => {
    const rankedGroup = makeRankedTokenGroup({
      stats: { volume1d: 12_400_000, volume7d: 80_000_000 },
      members: [
        {
          multichainToken: {
            symbol: 'TSLAON',
            name: 'Tesla (Ondo)',
            addresses: { [UniverseChainId.Mainnet]: '0xondo-mainnet' },
            issuer: { id: 'ondo', displayName: 'Ondo', logoUrl: '' },
          },
          stats: { volume1d: 8_000_000, volume7d: 50_000_000 },
        },
      ],
    })

    const rwa = mapRankedTokenGroup({
      rankedGroup,
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_7D,
    })

    expect(rwa?.volume24hUsd).toBe(80_000_000)
    expect(rwa?.issuerTokens[0]?.volume24hUsd).toBe(50_000_000)
  })

  it('orders member chain tokens mainnet-first then by chainId', () => {
    const rwa = mapRankedTokenGroup({
      rankedGroup: makeRankedTokenGroup(),
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rwa?.issuerTokens[0]?.chainTokens).toEqual([
      { chainId: UniverseChainId.Mainnet, address: '0xondo-mainnet' },
      { chainId: UniverseChainId.Base, address: '0xondo-base' },
    ])
  })

  it('uses the primary member sparkline for the group row', () => {
    const rwa = mapRankedTokenGroup({
      rankedGroup: makeRankedTokenGroup(),
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rwa?.sparkline1d).toEqual(rwa?.issuerTokens[0]?.sparkline1d)
  })

  it('falls back to the group logo when a member has no project logo', () => {
    const rankedGroup = makeRankedTokenGroup()
    rankedGroup.members[0]!.multichainToken!.project = undefined

    const rwa = mapRankedTokenGroup({
      rankedGroup,
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rwa?.issuerTokens[0]?.logoUrl).toBe('https://example.com/tsla.png')
  })

  it('keeps valid members and drops the invalid ones', () => {
    const valid = makeRankedTokenGroup().members[0]!
    const rankedGroup = makeRankedTokenGroup({
      members: [
        { multichainToken: { symbol: 'NOISSUER', addresses: { [UniverseChainId.Mainnet]: '0x1' } } },
        valid,
        { multichainToken: { symbol: 'NOCHAIN', addresses: {}, issuer: { id: 'ondo' } } },
      ],
    })

    const rwa = mapRankedTokenGroup({
      rankedGroup,
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rwa?.issuerTokens.map((issuer) => issuer.symbol)).toEqual(['TSLAON'])
  })

  it('falls back to member stats for price when the token carries none', () => {
    const rankedGroup = makeRankedTokenGroup()
    rankedGroup.members[0]!.multichainToken!.price = undefined
    rankedGroup.members[0]!.stats!.price = 250
    rankedGroup.members[0]!.stats!.priceChange1d = 2

    const rwa = mapRankedTokenGroup({
      rankedGroup,
      category: RwaCategory.STOCKS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rwa?.issuerTokens[0]).toMatchObject({ priceUsd: 250, priceChange24hPct: 2, priceChange1hPct: undefined })
  })

  it('drops members without an issuer id or a deployment', () => {
    const rankedGroup = makeRankedTokenGroup({
      members: [
        {
          multichainToken: { symbol: 'NOISSUER', addresses: { [UniverseChainId.Mainnet]: '0x1' } },
        },
        {
          multichainToken: { symbol: 'NOCHAIN', addresses: {}, issuer: { id: 'ondo' } },
        },
      ],
    })

    expect(
      mapRankedTokenGroup({ rankedGroup, category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    ).toBeNull()
  })

  it('drops groups without a ticker', () => {
    const rankedGroup = makeRankedTokenGroup({ group: { id: 'x', displayName: 'X', ticker: '' } })

    expect(
      mapRankedTokenGroup({ rankedGroup, category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D }),
    ).toBeNull()
  })

  it('falls back to the ticker when the group has no display name', () => {
    const rankedGroup = makeRankedTokenGroup({ group: { id: 'tsla', ticker: 'TSLA', displayName: '' } })
    expect(
      mapRankedTokenGroup({ rankedGroup, category: RwaCategory.STOCKS, volumeOrderBy: TokensOrderBy.VOLUME_1D })?.name,
    ).toBe('TSLA')
  })
})

describe('mapRankedTokenGroupList', () => {
  it('returns an empty list without a response', () => {
    expect(
      mapRankedTokenGroupList({
        response: undefined,
        category: RwaCategory.STOCKS,
        volumeOrderBy: TokensOrderBy.VOLUME_1D,
      }),
    ).toEqual([])
  })

  it('maps every valid group and skips invalid ones', () => {
    const response = new ListTokenGroupsResponse({
      tokenGroups: [makeRankedTokenGroup(), makeRankedTokenGroup({ group: { ticker: '' } })],
    })

    const rows = mapRankedTokenGroupList({
      response,
      category: RwaCategory.ETFS,
      volumeOrderBy: TokensOrderBy.VOLUME_1D,
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.categories).toEqual([RwaCategory.ETFS])
  })
})
