import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  Category,
  CategoryClass,
  CategoryKind,
  CategoryPoolAggregateStats,
  CategoryTopPool,
  RankedCategory,
  RankedPoolCategory,
} from '@uniswap/client-data-api/dist/data/v2/categories_pb'
import { TokenGroup } from '@uniswap/client-data-api/dist/data/v2/tokenGroups_pb'
import { TokensOrderBy, TokensSort } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import {
  localizeCategory,
  rankedCategoryToTokenCategory,
  rankedPoolCategoryToPoolCategory,
} from 'uniswap/src/data/apiClients/dataApiService/categories/categoryMappers'
import { Language } from 'uniswap/src/features/language/constants'

const ranked = new RankedCategory({
  category: new Category({
    id: 'defi',
    name: 'DeFi',
    description: 'Decentralized finance tokens.',
    class: CategoryClass.SECTOR,
    nameTranslations: { 'fr-FR': 'DeFi (fr)' },
    descriptionTranslations: { 'fr-FR': 'Jetons de finance décentralisée.' },
  }),
})

const rankedStocks = new RankedCategory({
  category: new Category({ id: 'stocks', name: 'Stocks', class: CategoryClass.ASSET, grouped: true }),
  topGroups: [
    new TokenGroup({
      id: 'nvda',
      displayName: 'Nvidia',
      ticker: 'NVDA',
      categoryId: 'stocks',
      logoUrl: 'https://logos.test/nvda.png',
    }),
  ],
})

const rankedPool = new RankedPoolCategory({
  category: new Category({
    id: 'major-pools',
    name: 'Majors',
    description: 'Pools composed entirely of Majors.',
    class: CategoryClass.ASSET,
    kind: CategoryKind.POOL,
  }),
  stats: new CategoryPoolAggregateStats({ poolCount: 240, tvl: 1.42e9, volume1d: 6.1e8, fees1d: 732000, avgApr: 9.6 }),
  topPools: [
    new CategoryTopPool({
      chainId: 1,
      poolId: '0xpool',
      token0Symbol: 'ETH',
      token0LogoUrl: 'https://logos.test/eth.png',
      token1Symbol: 'USDC',
      token1LogoUrl: 'https://logos.test/usdc.png',
      protocolVersion: ProtocolVersion.V3,
      feeTier: 3000,
    }),
  ],
})

describe(rankedCategoryToTokenCategory, () => {
  it('reads a category without a kind as a token category', () => {
    expect(rankedCategoryToTokenCategory(ranked)?.kind).toBe('token')
  })

  it('drops a pool category served under the token wrapper', () => {
    const mismatched = new RankedCategory({ category: new Category({ ...rankedPool.category, grouped: false }) })
    expect(rankedCategoryToTokenCategory(mismatched)).toBeUndefined()
  })

  it('keeps the English fields and carries the translation maps', () => {
    expect(rankedCategoryToTokenCategory(ranked)).toMatchObject({
      name: 'DeFi',
      description: 'Decentralized finance tokens.',
      nameTranslations: { 'fr-FR': 'DeFi (fr)' },
      descriptionTranslations: { 'fr-FR': 'Jetons de finance décentralisée.' },
    })
  })

  it('maps the top groups and leaves them empty for an ungrouped category', () => {
    expect(rankedCategoryToTokenCategory(rankedStocks)?.topGroups).toEqual([
      { id: 'nvda', displayName: 'Nvidia', ticker: 'NVDA', logoUrl: 'https://logos.test/nvda.png' },
    ])
    expect(rankedCategoryToTokenCategory(ranked)?.topGroups).toEqual([])
  })

  it('maps the default sort', () => {
    const topLosers = new RankedCategory({
      category: new Category({
        id: 'top-losers',
        name: 'Top Losers',
        class: CategoryClass.MARKET,
        defaultSort: new TokensSort({ orderBy: TokensOrderBy.PRICE_CHANGE_1D, ascending: true }),
      }),
    })
    const stablecoins = new RankedCategory({
      category: new Category({
        id: 'stablecoins',
        name: 'Stablecoins',
        class: CategoryClass.ASSET,
        defaultSort: new TokensSort({ orderBy: TokensOrderBy.VOLUME_1D }),
      }),
    })

    expect(rankedCategoryToTokenCategory(topLosers)?.defaultSort).toEqual({
      orderBy: TokensOrderBy.PRICE_CHANGE_1D,
      ascending: true,
    })
    expect(rankedCategoryToTokenCategory(stablecoins)?.defaultSort).toEqual({
      orderBy: TokensOrderBy.VOLUME_1D,
      ascending: false,
    })
  })

  it('leaves the default sort undefined when unset or unspecified', () => {
    const unspecified = new RankedCategory({
      category: new Category({
        id: 'unspecified',
        name: 'Unspecified',
        class: CategoryClass.SECTOR,
        defaultSort: new TokensSort({ orderBy: TokensOrderBy.UNSPECIFIED }),
      }),
    })

    expect(rankedCategoryToTokenCategory(ranked)?.defaultSort).toBeUndefined()
    expect(rankedCategoryToTokenCategory(unspecified)?.defaultSort).toBeUndefined()
  })
})

describe(rankedPoolCategoryToPoolCategory, () => {
  it('maps the pool stats and top pools', () => {
    expect(rankedPoolCategoryToPoolCategory(rankedPool)).toEqual({
      id: 'major-pools',
      kind: 'pool',
      name: 'Majors',
      englishName: 'Majors',
      description: 'Pools composed entirely of Majors.',
      nameTranslations: {},
      descriptionTranslations: {},
      categoryClass: 'asset',
      stats: {
        poolCount: 240,
        tvl: 1.42e9,
        volume1d: 6.1e8,
        volume1w: 0,
        volume1m: 0,
        fees1d: 732000,
        tvlChange24hPct: undefined,
        volumeChange24hPct: undefined,
        avgApr: 9.6,
      },
      topPools: [
        {
          chainId: 1,
          poolId: '0xpool',
          token0Symbol: 'ETH',
          token0LogoUrl: 'https://logos.test/eth.png',
          token1Symbol: 'USDC',
          token1LogoUrl: 'https://logos.test/usdc.png',
          protocolVersion: ProtocolVersion.V3,
          feeTier: 3000,
        },
      ],
    })
  })

  it('drops a token category served under the pool wrapper', () => {
    expect(rankedPoolCategoryToPoolCategory(new RankedPoolCategory({ category: ranked.category }))).toBeUndefined()
  })
})

describe(localizeCategory, () => {
  const category = rankedCategoryToTokenCategory(ranked)!

  it('returns the same object for English', () => {
    expect(localizeCategory(category, Language.English)).toBe(category)
  })

  it('picks the translation for the current language', () => {
    expect(localizeCategory(category, Language.French)).toMatchObject({
      name: 'DeFi (fr)',
      description: 'Jetons de finance décentralisée.',
    })
  })

  it('falls back to English when the language has no translation', () => {
    expect(localizeCategory(category, Language.Japanese)).toBe(category)
  })
})
