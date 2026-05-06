import { renderHook } from '@testing-library/react'
import { OnchainItemListOptionType, type TokenOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useOnchainItemListSection } from 'uniswap/src/components/lists/utils'
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
