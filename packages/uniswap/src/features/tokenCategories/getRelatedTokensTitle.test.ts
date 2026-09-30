import type { TFunction } from 'i18next'
import { getRelatedTokensTitle } from 'uniswap/src/features/tokenCategories/getRelatedTokensTitle'
import { KNOWN_TOKEN_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/knownTokenCategoryIds'
import { tokenCategory } from 'uniswap/src/test/fixtures/tokenCategory'

const t = ((key: string, options?: { category?: string }) =>
  options?.category ? `${key}:${options.category}` : key) as unknown as TFunction

describe(getRelatedTokensTitle, () => {
  it('has a singular key for every known category id', () => {
    for (const id of KNOWN_TOKEN_CATEGORY_IDS) {
      expect(getRelatedTokensTitle({ t, category: tokenCategory({ id }) })).not.toContain('fallback')
    }
  })

  it('falls back to the plural name for unknown ids', () => {
    const category = tokenCategory({ id: 'memes', name: 'Memes' })
    expect(getRelatedTokensTitle({ t, category })).toBe('tdp.relatedTokens.single.fallback:Memes')
  })
})
