import { QueryClient } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices'
import { getDisplayedPriceSource } from 'uniswap/src/features/prices/getDisplayedPriceSource'

const CHAIN_ID = 1
const ADDRESS = `0x${'a'.repeat(40)}`

describe(getDisplayedPriceSource, () => {
  it('tags trade-derived USD values regardless of the per-token cache source', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(priceKeys.token(CHAIN_ID, ADDRESS), {
      price: 1769.78,
      timestamp: 0,
      source: 'tapi_quote',
    })

    expect(
      getDisplayedPriceSource({
        isCentralizedPricesEnabled: true,
        surface: 'usdc',
        chainId: CHAIN_ID,
        address: ADDRESS,
        queryClient,
        isTradeDerivedUsd: true,
      }),
    ).toBe('trade_derived')

    expect(
      getDisplayedPriceSource({
        isCentralizedPricesEnabled: false,
        surface: 'usdc',
        chainId: CHAIN_ID,
        address: ADDRESS,
        isTradeDerivedUsd: true,
      }),
    ).toBe('trade_derived')
  })

  it('keeps the per-token cache source for non-trade-derived values', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(priceKeys.token(CHAIN_ID, ADDRESS), {
      price: 1769.78,
      timestamp: 0,
      source: 'tapi_quote',
    })

    expect(
      getDisplayedPriceSource({
        isCentralizedPricesEnabled: true,
        surface: 'usdc',
        chainId: CHAIN_ID,
        address: ADDRESS,
        queryClient,
        isTradeDerivedUsd: false,
      }),
    ).toBe('tapi_quote')
  })

  it('keeps the legacy control-group tags', () => {
    expect(
      getDisplayedPriceSource({
        isCentralizedPricesEnabled: false,
        surface: 'usdc',
        chainId: CHAIN_ID,
        address: ADDRESS,
      }),
    ).toBe('tapi_quote')

    expect(
      getDisplayedPriceSource({
        isCentralizedPricesEnabled: false,
        surface: 'market_stats',
        chainId: CHAIN_ID,
        address: ADDRESS,
      }),
    ).toBe('legacy_coingecko')

    expect(
      getDisplayedPriceSource({
        isCentralizedPricesEnabled: false,
        surface: 'spot',
        chainId: CHAIN_ID,
        address: ADDRESS,
      }),
    ).toBe('legacy_subgraph')
  })
})
