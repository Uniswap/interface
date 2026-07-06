import { getAddress } from '@ethersproject/address'

/**
 * Validates an address and returns the parsed (checksummed) version of that address
 * @param address the unchecksummed hex address
 */
export function validateAndParseAddress(address: string): string {
  try {
    return getAddress(address)
  } catch (error) {
    throw new Error(`${address} is not a valid address.`)
  }
}

// Checks a string starts with 0x, is 42 characters long and contains only hex characters after 0x
const startsWith0xLen42HexRegex = /^0x[0-9a-fA-F]{40}$/

/**
 * Checks if an address is valid by checking 0x prefix, length === 42 and hex encoding.
 * @param address the unchecksummed hex address
 */
export function checkValidAddress(address: string): string {
  if (startsWith0xLen42HexRegex.test(address)) {
    return address
  }

  throw new Error(`${address} is not a valid address.`)
}
