import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  OnchainItemListOptionType,
  type RwaTokenOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import { isStocksRowItem, key, shouldShowCategoryTag } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const rwaA: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Bnb,
  address: '0xe92f673ca36c5e2efd2de7628f815f84807e803f',
  symbol: 'GOOGLX',
  name: 'Alphabet',
}

const rwaB: RwaTokenOption = {
  type: OnchainItemListOptionType.Rwa,
  chainId: UniverseChainId.Mainnet,
  address: '0x1111111111111111111111111111111111111111',
  symbol: 'AAPLX',
  name: 'Apple',
}

const tokenOption = {
  type: OnchainItemListOptionType.Token,
  currencyInfo: { currencyId: 'token-currency-id' },
} as TokenOption

describe('TokenSelectorList helpers', () => {
  describe('isStocksRowItem', () => {
    it('returns true for an RWA array', () => {
      expect(isStocksRowItem([rwaA])).toBe(true)
    })

    it('returns false for a token-option array', () => {
      expect(isStocksRowItem([tokenOption])).toBe(false)
    })

    it('returns false for a single token option', () => {
      expect(isStocksRowItem(tokenOption)).toBe(false)
    })
  })

  describe('key', () => {
    it('joins chainId-address pairs for a stocks row', () => {
      expect(key([rwaA, rwaB])).toBe(`${rwaA.chainId}-${rwaA.address}-${rwaB.chainId}-${rwaB.address}`)
    })

    it('joins currencyId for a token-option array', () => {
      expect(key([tokenOption])).toBe(tokenOption.currencyInfo.currencyId)
    })

    it('returns the currencyId for a single token option', () => {
      expect(key(tokenOption)).toBe(tokenOption.currencyInfo.currencyId)
    })

    it('returns an empty string for an empty list option without throwing', () => {
      expect(key([])).toBe('')
    })
  })

  describe('shouldShowCategoryTag', () => {
    it('shows the tag for a classified RWA with no balance', () => {
      expect(shouldShowCategoryTag({ rwaCategory: RwaCategory.STOCKS, hasBalance: false })).toBe(true)
      expect(shouldShowCategoryTag({ rwaCategory: RwaCategory.ETFS, hasBalance: false })).toBe(true)
    })

    it('hides the tag when the user holds a balance (balance overrides)', () => {
      expect(shouldShowCategoryTag({ rwaCategory: RwaCategory.STOCKS, hasBalance: true })).toBe(false)
    })

    it('hides the tag for a non-RWA / unspecified token', () => {
      expect(shouldShowCategoryTag({ rwaCategory: undefined, hasBalance: false })).toBe(false)
      expect(shouldShowCategoryTag({ rwaCategory: RwaCategory.UNSPECIFIED, hasBalance: false })).toBe(false)
    })
  })
})
