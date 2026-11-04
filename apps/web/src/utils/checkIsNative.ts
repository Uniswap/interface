import { Currency } from '@uniswap/sdk-core'
import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

export function checkIsNative(addressOrCurrency?: string | Currency): boolean {
  return typeof addressOrCurrency === 'string'
    ? [NATIVE_CHAIN_ID, 'native', 'eth'].includes(normalizeAddress(addressOrCurrency, AddressStringFormat.Lowercase))
    : (addressOrCurrency?.isNative ?? false)
}
