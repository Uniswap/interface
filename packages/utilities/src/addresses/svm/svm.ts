import { PublicKey } from '@solana/web3.js'

/**
 * Checks if the given input string is a valid 32-byte base58-encoded string,
 * which is the format used for Solana public keys.
 *
 * @param input - The string to check.
 * @returns True if the input is a valid 32-byte base58 string, false otherwise.
 */
export const isSVMAddress = (input: string): boolean => {
  try {
    const _test = new PublicKey(input)
    return true
  } catch {
    return false
  }
}
