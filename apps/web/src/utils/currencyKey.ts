import { Currency } from '@uniswap/sdk-core'
import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

export type CurrencyKey = string

export function buildCurrencyKey(chainId: UniverseChainId, address: string): CurrencyKey {
  // We normalize for compatibility/indexability between gql tokens and sdk currencies
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

export function currencyKey(currency: Currency): CurrencyKey {
  return buildCurrencyKey(currency.chainId, currency.isToken ? currency.address : NATIVE_CHAIN_ID)
}

/** Same key `currencyKey` produces for the matching sdk Currency; undefined for unsupported chains. */
export function currencyKeyFromCurrencyId(currencyId: string): CurrencyKey | undefined {
  const chainId = currencyIdToChain(currencyId)
  if (!chainId) {
    return undefined
  }
  const address = currencyIdToAddress(currencyId)
  return buildCurrencyKey(chainId, isNativeCurrencyAddress(chainId, address) ? NATIVE_CHAIN_ID : address)
}
