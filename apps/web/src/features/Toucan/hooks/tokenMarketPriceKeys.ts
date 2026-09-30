import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { buildCurrencyKey, currencyKeyFromCurrencyId, type CurrencyKey } from '~/utils/currencyKey'

// Auction contracts express the native bid token as the zero address.
export function buildTokenMarketCurrencyId({ chainId, address }: { chainId: number; address: string }): string {
  return address === ZERO_ADDRESS ? buildNativeCurrencyId(chainId) : buildCurrencyId(chainId, address)
}

/** Key into the `PriceMap` returned by `useCurrencyKeyPriceMap` for an auction-side token. */
export function buildTokenMarketPriceKey({ chainId, address }: { chainId: number; address: string }): CurrencyKey {
  return (
    currencyKeyFromCurrencyId(buildTokenMarketCurrencyId({ chainId, address })) ?? buildCurrencyKey(chainId, address)
  )
}
