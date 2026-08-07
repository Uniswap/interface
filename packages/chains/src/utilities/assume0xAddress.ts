import type { Address } from 'viem'

/**
 * Assume a string is a `0x` address without validating, for addresses that were
 * validated upstream. This is the one sanctioned home for the `as Address` cast
 * (the `no-restricted-syntax` lint points here); use viem's `isAddress`/`getAddress`
 * when the input has not already been validated.
 */
export function assume0xAddress(address: string): Address
export function assume0xAddress(address: string | undefined): Address | undefined
export function assume0xAddress(address: string | undefined): Address | undefined {
  return address as Address | undefined
}
