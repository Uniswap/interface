import { shortenAddress } from 'utils/index'

export default function getShortenAddress(address: string) {
  try {
    return shortenAddress(address)
  } catch (err) {
    return address.length > 13 ? address.substr(0, 6) + '...' + address.slice(-4) : address
  }
}
