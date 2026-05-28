import { describe, expect, it } from 'vitest'
import {
  getInitialConfigureAuctionInputCurrency,
  getNextConfigureAuctionInputCurrency,
} from '~/pages/Liquidity/CreateAuction/steps/configureAuctionInputCurrency'

describe('configure auction input currency defaults', () => {
  it('defaults to USD when a USD oracle is available', () => {
    expect(getInitialConfigureAuctionInputCurrency({ floorPriceInput: undefined, hasUsdOracle: true })).toBe('usd')
  })

  it('switches from raise currency to USD when the oracle becomes available and no persisted input exists', () => {
    expect(
      getNextConfigureAuctionInputCurrency({
        current: 'raise',
        floorPriceInput: undefined,
        hasUsdOracle: true,
        raiseCurrencyChanged: false,
      }),
    ).toBe('usd')
  })

  it('keeps a persisted raise-currency input when the oracle is available', () => {
    expect(
      getNextConfigureAuctionInputCurrency({
        current: 'raise',
        floorPriceInput: {
          floorPrice: '0.01',
          rawValue: '0.01',
          denomination: 'floorPrice',
          inputCurrency: 'raise',
        },
        hasUsdOracle: true,
        raiseCurrencyChanged: false,
      }),
    ).toBe('raise')
  })

  it('restores a persisted USD selection even while the oracle snapshot is loading on remount', () => {
    expect(
      getInitialConfigureAuctionInputCurrency({
        floorPriceInput: {
          floorPrice: '0.0004',
          rawValue: '1',
          denomination: 'floorPrice',
          inputCurrency: 'usd',
        },
        hasUsdOracle: false,
      }),
    ).toBe('usd')
  })

  it('keeps USD while the oracle snapshot is loading if the user persisted USD', () => {
    expect(
      getNextConfigureAuctionInputCurrency({
        current: 'usd',
        floorPriceInput: {
          floorPrice: '0.0004',
          rawValue: '1',
          denomination: 'floorPrice',
          inputCurrency: 'usd',
        },
        hasUsdOracle: false,
        raiseCurrencyChanged: false,
      }),
    ).toBe('usd')
  })

  it('still falls back from USD to raise when no USD selection is persisted', () => {
    expect(
      getNextConfigureAuctionInputCurrency({
        current: 'usd',
        floorPriceInput: undefined,
        hasUsdOracle: false,
        raiseCurrencyChanged: false,
      }),
    ).toBe('raise')
  })
})
