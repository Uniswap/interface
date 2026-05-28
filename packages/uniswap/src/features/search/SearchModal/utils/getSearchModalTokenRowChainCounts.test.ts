import {
  OnchainItemListOptionType,
  type MultichainTokenOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import type { CurrencyInfo, MultichainSearchResult } from 'uniswap/src/features/dataApi/types'
import { describe, expect, it } from 'vitest'
import { getSearchModalTokenRowChainCounts } from './getSearchModalTokenRowChainCounts'

const minimalCurrencyInfo = { currencyId: '1-0xabc' } as CurrencyInfo

function tokenSection(
  data: (TokenOption | MultichainTokenOption)[],
): OnchainItemSection<TokenOption | MultichainTokenOption> {
  return { sectionKey: OnchainItemSectionName.Tokens, data }
}

describe('getSearchModalTokenRowChainCounts', () => {
  it('returns empty for undefined or empty sections', () => {
    expect(getSearchModalTokenRowChainCounts(undefined)).toEqual([])
    expect(getSearchModalTokenRowChainCounts([])).toEqual([])
  })

  it('counts token rows in trending and results sections', () => {
    const sections: OnchainItemSection<TokenOption | MultichainTokenOption>[] = [
      { sectionKey: OnchainItemSectionName.TrendingTokens, data: [] },
      tokenSection([
        {
          type: OnchainItemListOptionType.Token,
          currencyInfo: minimalCurrencyInfo,
          quantity: null,
          balanceUSD: undefined,
        },
      ]),
    ]
    expect(getSearchModalTokenRowChainCounts(sections)).toEqual([1])
  })

  it('counts multichain rows by tokens.length', () => {
    const multi: MultichainSearchResult = {
      id: 'mc',
      name: 'USDC',
      symbol: 'USDC',
      logoUrl: null,
      tokens: [minimalCurrencyInfo, minimalCurrencyInfo],
    }
    const sections = [
      tokenSection([
        {
          type: OnchainItemListOptionType.MultichainToken,
          multichainResult: multi,
          primaryCurrencyInfo: minimalCurrencyInfo,
        },
        {
          type: OnchainItemListOptionType.Token,
          currencyInfo: minimalCurrencyInfo,
          quantity: null,
          balanceUSD: undefined,
        },
      ]),
    ]
    expect(getSearchModalTokenRowChainCounts(sections)).toEqual([2, 1])
  })
})
