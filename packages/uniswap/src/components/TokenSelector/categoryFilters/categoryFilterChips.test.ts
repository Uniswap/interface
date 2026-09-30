import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import {
  deriveCategoryFilterChips,
  filterSectionsByChips,
  filterTokenOptionsByChips,
  isFilteredEmpty,
  MY_TOKENS_CHIP_ID,
  resolveActiveChipIds,
} from 'uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips'
import { mergeCurrencyInfosWithBalances } from 'uniswap/src/components/TokenSelector/hooks/useCurrencyInfosToTokenOptions'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'
import { portfolioBalance } from 'uniswap/src/test/fixtures/wallet/balances'
import { currencyInfo, usdcCurrencyInfo } from 'uniswap/src/test/fixtures/wallet/currencies'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

const stocks = tokenCategory({ id: 'stocks', name: 'Stocks' })
const memes = tokenCategory({ id: 'memes', name: 'Memes' })
const defi = tokenCategory({ id: 'defi', name: 'DeFi' })
const categories = [stocks, memes, defi]

function option({
  id,
  categoryIds,
  quantity = null,
}: {
  id: string
  categoryIds?: string[]
  quantity?: number | null
}): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: currencyInfo({ currencyId: id, categoryIds }),
    quantity,
    balanceUSD: null,
  }
}

const ownedStock = option({ id: 'tslaon', categoryIds: ['stocks'], quantity: 22 })
const stock = option({ id: 'tslax', categoryIds: ['stocks', 'low-volatility'] })
const meme = option({ id: 'dogimus', categoryIds: ['memes'] })
const untagged = option({ id: 'plain' })

describe('deriveCategoryFilterChips', () => {
  it('returns one chip per category present, in canonical order, with My tokens first when a balance exists', () => {
    const chips = deriveCategoryFilterChips({ options: [meme, ownedStock, untagged], categories })
    expect(chips.map((chip) => chip.id)).toEqual([MY_TOKENS_CHIP_ID, 'stocks', 'memes'])
  })

  it('omits My tokens when no result carries a balance', () => {
    const chips = deriveCategoryFilterChips({ options: [stock, meme], categories })
    expect(chips.map((chip) => chip.id)).toEqual(['stocks', 'memes'])
  })

  it('ignores category ids not in the known taxonomy', () => {
    const chips = deriveCategoryFilterChips({ options: [stock], categories })
    expect(chips.map((chip) => chip.id)).toEqual(['stocks'])
  })

  it('returns no chips when results carry no categories, even with balances', () => {
    expect(deriveCategoryFilterChips({ options: [option({ id: 'x', quantity: 1 })], categories })).toEqual([])
  })
})

describe('resolveActiveChipIds', () => {
  it('drops selections whose chip disappeared from the result set', () => {
    const chips = deriveCategoryFilterChips({ options: [stock], categories })
    expect(resolveActiveChipIds({ selectedIds: [MY_TOKENS_CHIP_ID, 'memes', 'stocks'], chips })).toEqual(['stocks'])
  })
})

describe('filterTokenOptionsByChips', () => {
  const options = [ownedStock, stock, meme, untagged]

  it('is the identity with no active chips', () => {
    expect(filterTokenOptionsByChips({ options, activeIds: [] })).toBe(options)
  })

  it('filters to a single category', () => {
    expect(filterTokenOptionsByChips({ options, activeIds: ['stocks'] })).toEqual([ownedStock, stock])
  })

  it('ORs multiple category chips', () => {
    expect(filterTokenOptionsByChips({ options, activeIds: ['stocks', 'memes'] })).toEqual([ownedStock, stock, meme])
  })

  it('ANDs My tokens with the category chips', () => {
    expect(filterTokenOptionsByChips({ options, activeIds: [MY_TOKENS_CHIP_ID, 'stocks'] })).toEqual([ownedStock])
    expect(filterTokenOptionsByChips({ options, activeIds: [MY_TOKENS_CHIP_ID, 'memes'] })).toEqual([])
  })

  it('filters to owned tokens with only My tokens active', () => {
    expect(filterTokenOptionsByChips({ options, activeIds: [MY_TOKENS_CHIP_ID] })).toEqual([ownedStock])
  })

  it('keeps an owned result under its category chip after the portfolio merge', () => {
    const balanceInfo: CurrencyInfo = usdcCurrencyInfo()
    const searchInfo: CurrencyInfo = { ...balanceInfo, categoryIds: ['stocks'] }
    const balance = portfolioBalance({ currencyInfo: balanceInfo, quantity: 5 })
    const merged = mergeCurrencyInfosWithBalances({
      currencyInfos: [searchInfo],
      portfolioBalancesById: { [normalizeCurrencyIdForMapLookup(balanceInfo.currencyId)]: balance },
    })

    expect(filterTokenOptionsByChips({ options: merged, activeIds: [MY_TOKENS_CHIP_ID, 'stocks'] })).toEqual(merged)
  })
})

describe('filterSectionsByChips', () => {
  const sections: OnchainItemSection<TokenOption>[] = [
    { sectionKey: OnchainItemSectionName.SearchResults, data: [ownedStock, meme] },
    { sectionKey: OnchainItemSectionName.OtherChainsTokens, data: [untagged] },
  ]

  it('keeps the same reference with no active chips', () => {
    expect(filterSectionsByChips({ sections, activeIds: [] })).toBe(sections)
  })

  it('filters each section and drops the ones it empties', () => {
    expect(filterSectionsByChips({ sections, activeIds: ['stocks'] })).toEqual([
      { sectionKey: OnchainItemSectionName.SearchResults, data: [ownedStock] },
    ])
  })
})

describe('isFilteredEmpty', () => {
  const sections: OnchainItemSection<TokenOption>[] = [
    { sectionKey: OnchainItemSectionName.SearchResults, data: [meme] },
  ]

  it('is false with no active chips, even when there are no results', () => {
    expect(isFilteredEmpty({ sections: [], filteredSections: [], activeIds: [] })).toBe(false)
  })

  it('is false when the query itself has no results', () => {
    expect(isFilteredEmpty({ sections: [], filteredSections: [], activeIds: ['stocks'] })).toBe(false)
  })

  it('is true when results exist but the active chips removed them all', () => {
    const filteredSections = filterSectionsByChips({ sections, activeIds: [MY_TOKENS_CHIP_ID] })
    expect(isFilteredEmpty({ sections, filteredSections, activeIds: [MY_TOKENS_CHIP_ID] })).toBe(true)
  })

  it('is false while active chips still leave rows', () => {
    const filteredSections = filterSectionsByChips({ sections, activeIds: ['memes'] })
    expect(isFilteredEmpty({ sections, filteredSections, activeIds: ['memes'] })).toBe(false)
  })
})
