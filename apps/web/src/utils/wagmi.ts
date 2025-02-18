import { Address } from 'viem'

/**
 * Used to cast a `string` to the viem `Address` type, or cast `string | undefined` to `Address | undefined`.
 *
 * NOTE: This function does not perform any leading character or checksum validation.
 * It should only be used in parts of the codebase where addresses are assumed to be formatted correctly, but are typed as strings rather than the narrower `Address` type from viem.
 * This is useful for cases where addresses need to be passed to wagmi hooks which require the viem Address type.
 */
export function assume0xAddress(address: string): Address
export function assume0xAddress(address: string | undefined): Address | undefined
export function assume0xAddress(address: string | undefined): Address | undefined {
  // eslint-disable-next-line no-restricted-syntax
  return address as Address | undefined
}
