import { getAddress } from '@ethersproject/address'

// returns the checksummed address if the address is valid, otherwise returns false
export function isEVMAddress(value?: string | null | undefined): `0x${string}` | false {
  if (!value) {
    return false
  }
  try {
    // Alphabetical letters must be made lowercase for getAddress to work.
    // See documentation here: https://docs.ethers.io/v5/api/utils/address/
    // eslint-disable-next-line local-rules/no-hex-string-casting
    return getAddress(value.toLowerCase()) as `0x${string}`
  } catch {
    return false
  }
}
