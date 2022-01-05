import { utils } from 'ethers'
import { ensureLeading0x } from 'src/utils/addresses'

export function isValidPrivateKey(value: string) {
  if (!value) return false
  const normalized = ensureLeading0x(value)
  return utils.isHexString(normalized) && normalized.length === 66
}
