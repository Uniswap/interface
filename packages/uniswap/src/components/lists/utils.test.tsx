import { renderHook } from '@testing-library/react'
import {
  OnchainItemListOptionType,
  type RwaTokenOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ETH_CURRENCY_INFO } from 'uniswap/src/test/fixtures'

describe('useOnchainItemListSection', () => {
  const tokenOption: TokenOption = {
    type: OnchainItemListOptionType.Token,
    currencyInfo: ETH_CURRENCY_INFO,
    quantity: null,
    balanceUSD: null,
  }

  it('preserves custom section header height metadata', () => {
    const { result } = renderHook(() =>
      useOnchainItemListSection({
        sectionKey: OnchainItemSectionName.YourTokens,
        options: [tokenOption],
        sectionHeaderHeight: 104,
      }),
    )

    expect(result.current?.[0]?.sectionHeaderHeight).toBe(104)
  })
})

describe('useOnchainItemListSection with a non-token 2D array', () => {
  const stock: RwaTokenOption = {
    type: OnchainItemListOptionType.Rwa,
    chainId: UniverseChainId.Bnb,
    address: '0xabc',
    symbol: 'GOOGLX',
    name: 'Alphabet',
  }

  it('builds a section for a non-empty RwaTokenOption[] row', () => {
    const { result } = renderHook(() =>
      useOnchainItemListSection({ sectionKey: OnchainItemSectionName.Stocks, options: [[stock]] }),
    )
    expect(result.current).toHaveLength(1)
    expect(result.current?.[0]?.data).toEqual([[stock]])
  })

  it('returns undefined for an empty inner row', () => {
    const { result } = renderHook(() =>
      useOnchainItemListSection({ sectionKey: OnchainItemSectionName.Stocks, options: [[]] }),
    )
    expect(result.current).toBeUndefined()
  })
})
