import { Category, CategoryClass, RankedCategory } from '@uniswap/client-data-api/dist/data/v2/categories_pb'
import { TokenGroup } from '@uniswap/client-data-api/dist/data/v2/tokenGroups_pb'
import {
  localizeTokenCategory,
  rankedCategoryToTokenCategory,
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

describe(rankedCategoryToTokenCategory, () => {
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
})

describe(localizeTokenCategory, () => {
  const category = rankedCategoryToTokenCategory(ranked)!

  it('returns the same object for English', () => {
    expect(localizeTokenCategory(category, Language.English)).toBe(category)
  })

  it('picks the translation for the current language', () => {
    expect(localizeTokenCategory(category, Language.French)).toMatchObject({
      name: 'DeFi (fr)',
      description: 'Jetons de finance décentralisée.',
    })
  })

  it('falls back to English when the language has no translation', () => {
    expect(localizeTokenCategory(category, Language.Japanese)).toBe(category)
  })
})
