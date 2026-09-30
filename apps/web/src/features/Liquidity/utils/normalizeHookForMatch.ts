import { AddressStringFormat, normalizeAddress } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'

/**
 * Hookless is represented differently per source (v1 filter: '' / zero address; v2 responses: unset or
 * zero address; pool links: the zero address); normalize all of them to undefined, and real hooks to
 * lowercase, so hook addresses can be compared regardless of where each side came from.
 */
export function normalizeHookForMatch(hookAddress: string | null | undefined): string | undefined {
  if (!hookAddress) {
    return undefined
  }
  const normalized = normalizeAddress(hookAddress, AddressStringFormat.Lowercase)
  return normalized === ZERO_ADDRESS ? undefined : normalized
}
