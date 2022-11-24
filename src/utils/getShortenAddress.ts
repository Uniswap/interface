import { shortenAddress } from 'utils/index'

/**
 * This function can handle non-evm address like tron, solana, etc.
 * @param address
 * @param showX
 */
export default function getShortenAddress(address: string, showX = false) {
  try {
    return showX
      ? address.substr(0, 6) + (showX ? 'x'.repeat(address.length - 10) : '...') + address.slice(-4)
      : shortenAddress(1, address)
  } catch (err) {
    return address.length > 13
      ? address.substr(0, 6) + (showX ? 'x'.repeat(address.length - 10) : '...') + address.slice(-4)
      : address
  }
}
