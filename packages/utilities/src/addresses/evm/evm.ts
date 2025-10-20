import { getAddress } from '@ethersproject/address'
import { HexString } from 'utilities/src/addresses/hex'

/**
 * Validates if the address is a valid EVM address format
 *
 * NOTE(WALL-5160): Note that we do not check for [0-9a-fA-F] or checksum due to possible performance implications
 * Use isEVMAddressWithChecksum if checksum check is required
 *
 *  @returns true if the address is valid, otherwise returns false
 */
export function isEVMAddress(address?: string | null | undefined): address is HexString {
  if (!address) {
    return false
  }
  return (address.startsWith('0x') || address.startsWith('0X')) && address.length === 42
}

/**
 * @caution use isEVMAddress if checksum is not required
 *
 * Handles isEVMAddress check for both lowercased and checksummed addresses,
 * but *should* only be used to check for checksummed addresses since it is an expensive operation
 * @returns true if the address is valid, otherwise returns false
 */
export function isEVMAddressWithChecksum(value?: string | null | undefined): value is HexString {
  if (!value) {
    return false
  }
  try {
    // See documentation here: https://docs.ethers.io/v5/api/utils/address/
    getAddress(value)
    return true
  } catch (_error) {
    return false
  }
}
