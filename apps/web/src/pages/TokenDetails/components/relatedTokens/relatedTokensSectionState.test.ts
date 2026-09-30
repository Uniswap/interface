import type { TFunction } from 'i18next'
import { TokenCategoryClass, type TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { describe, expect, it } from 'vitest'
import { deriveRelatedTokensSectionState } from '~/pages/TokenDetails/components/relatedTokens/relatedTokensSectionState'

const t = ((key: string, options?: { category?: string }) =>
  options?.category ? `${key}:${options.category}` : key) as TFunction

function makeCategory(id: string, name: string): TokenCategory {
  return { id, name, description: '', categoryClass: TokenCategoryClass.Sector, grouped: false, topTokens: [] }
}

const STOCKS = makeCategory('stocks', 'Stocks')
const TRENDING = makeCategory('trending', 'Trending')
const MEMES = makeCategory('memes', 'Memes')

const loaded = { isLoading: false, isError: false, tokenCount: 5, t }

describe('deriveRelatedTokensSectionState', () => {
  it('returns undefined when the token has no categories', () => {
    expect(deriveRelatedTokensSectionState({ ...loaded, categories: [], pickedCategoryId: undefined })).toBeUndefined()
  })

  it('selects the picked category', () => {
    const state = deriveRelatedTokensSectionState({
      ...loaded,
      categories: [TRENDING, STOCKS],
      pickedCategoryId: STOCKS.id,
    })
    expect(state?.selectedCategory).toBe(STOCKS)
  })

  it('falls back to the first category when the pick is missing or stale', () => {
    expect(
      deriveRelatedTokensSectionState({ ...loaded, categories: [TRENDING, STOCKS], pickedCategoryId: undefined })
        ?.selectedCategory,
    ).toBe(TRENDING)
    expect(
      deriveRelatedTokensSectionState({ ...loaded, categories: [TRENDING, STOCKS], pickedCategoryId: 'gone' })
        ?.selectedCategory,
    ).toBe(TRENDING)
  })

  it('shows chips and the generic header for multi-category tokens', () => {
    const state = deriveRelatedTokensSectionState({
      ...loaded,
      categories: [TRENDING, STOCKS],
      pickedCategoryId: undefined,
    })
    expect(state?.showChips).toBe(true)
    expect(state?.title).toBe('tdp.relatedTokens.header')
  })

  it('hides chips and singularizes the title for single-category tokens', () => {
    const state = deriveRelatedTokensSectionState({ ...loaded, categories: [STOCKS], pickedCategoryId: undefined })
    expect(state?.showChips).toBe(false)
    expect(state?.title).toBe('tdp.relatedTokens.single.stocks')
  })

  it('uses the fallback title for an unknown single category', () => {
    const state = deriveRelatedTokensSectionState({ ...loaded, categories: [MEMES], pickedCategoryId: undefined })
    expect(state?.title).toBe('tdp.relatedTokens.single.fallback:Memes')
  })

  it('keeps a chipped section mounted when the selected category is empty or errored', () => {
    const empty = deriveRelatedTokensSectionState({
      ...loaded,
      tokenCount: 0,
      categories: [TRENDING, STOCKS],
      pickedCategoryId: undefined,
    })
    expect(empty?.isListEmpty).toBe(true)

    const errored = deriveRelatedTokensSectionState({
      ...loaded,
      isError: true,
      categories: [TRENDING, STOCKS],
      pickedCategoryId: undefined,
    })
    expect(errored?.isListEmpty).toBe(true)
  })

  it('hides a chipless section when its only category is empty or errored', () => {
    expect(
      deriveRelatedTokensSectionState({ ...loaded, tokenCount: 0, categories: [STOCKS], pickedCategoryId: undefined }),
    ).toBeUndefined()
    expect(
      deriveRelatedTokensSectionState({ ...loaded, isError: true, categories: [STOCKS], pickedCategoryId: undefined }),
    ).toBeUndefined()
  })

  it('does not treat a loading list as empty', () => {
    const state = deriveRelatedTokensSectionState({
      ...loaded,
      isLoading: true,
      tokenCount: 0,
      categories: [STOCKS],
      pickedCategoryId: undefined,
    })
    expect(state?.isListEmpty).toBe(false)
  })
})
