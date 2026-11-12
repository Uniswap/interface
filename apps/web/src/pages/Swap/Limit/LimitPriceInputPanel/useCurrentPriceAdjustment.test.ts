import { Price, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import {
  LimitPriceErrorType,
  useCurrentPriceAdjustment,
} from '~/pages/Swap/Limit/LimitPriceInputPanel/useCurrentPriceAdjustment'
import { renderHook } from '~/test-utils/render'

const TOKEN_A = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000001', 18, 'TKA', 'Token A')
const TOKEN_B = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000002', 18, 'TKB', 'Token B')

const MARKET_PRICE = new Price(TOKEN_A, TOKEN_B, '1', '10')

describe('useCurrentPriceAdjustment', () => {
  it('returns CALCULATION_ERROR when the market price is unavailable (fail-closed)', () => {
    const { result } = renderHook(() =>
      useCurrentPriceAdjustment({
        parsedLimitPrice: new Price(TOKEN_A, TOKEN_B, '1', '10'),
        marketPrice: undefined,
        baseCurrency: TOKEN_A,
        quoteCurrency: TOKEN_B,
        limitPriceInverted: false,
      }),
    )

    expect(result.current).toEqual({
      currentPriceAdjustment: undefined,
      priceError: LimitPriceErrorType.CALCULATION_ERROR,
    })
  })

  it('returns CALCULATION_ERROR when the limit price is undefined (the just-cleared rejection state)', () => {
    // On a rejected market-price reference the form clears `limitPrice`, so `parsedLimitPrice`
    // is undefined — pin that the hook still reports CALCULATION_ERROR in that exact state,
    // which is what keeps the "Market price not available" banner rendered after clearing.
    for (const marketPrice of [undefined, MARKET_PRICE]) {
      const { result } = renderHook(() =>
        useCurrentPriceAdjustment({
          parsedLimitPrice: undefined,
          marketPrice,
          baseCurrency: TOKEN_A,
          quoteCurrency: TOKEN_B,
          limitPriceInverted: false,
        }),
      )

      expect(result.current).toEqual({
        currentPriceAdjustment: undefined,
        priceError: LimitPriceErrorType.CALCULATION_ERROR,
      })
    }
  })

  it('returns BELOW_MARKET when the limit price is below the market price', () => {
    const { result } = renderHook(() =>
      useCurrentPriceAdjustment({
        parsedLimitPrice: new Price(TOKEN_A, TOKEN_B, '1', '9'),
        marketPrice: MARKET_PRICE,
        baseCurrency: TOKEN_A,
        quoteCurrency: TOKEN_B,
        limitPriceInverted: false,
      }),
    )

    expect(result.current).toEqual({
      currentPriceAdjustment: -10,
      priceError: LimitPriceErrorType.BELOW_MARKET,
    })
  })

  it('returns no error when the limit price is above the market price', () => {
    const { result } = renderHook(() =>
      useCurrentPriceAdjustment({
        parsedLimitPrice: new Price(TOKEN_A, TOKEN_B, '1', '11'),
        marketPrice: MARKET_PRICE,
        baseCurrency: TOKEN_A,
        quoteCurrency: TOKEN_B,
        limitPriceInverted: false,
      }),
    )

    expect(result.current).toEqual({
      currentPriceAdjustment: 10,
      priceError: undefined,
    })
  })
})
