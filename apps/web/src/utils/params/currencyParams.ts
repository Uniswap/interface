import type { ParsedQs } from 'qs'
import type { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

/** Validates and normalizes a currency address (or ETH / native sentinel) from a query param. */
export function parseCurrencyFromURLParameter(urlParam: ParsedQs[string], platform: Platform): string | undefined {
  if (typeof urlParam === 'string') {
    const valid = getValidAddress({ address: urlParam, platform, withEVMChecksum: true })
    if (valid) {
      return valid
    }

    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') {
      return 'ETH'
    }

    if (urlParam === NATIVE_CHAIN_ID) {
      return NATIVE_CHAIN_ID
    }
  }
  return undefined
}
