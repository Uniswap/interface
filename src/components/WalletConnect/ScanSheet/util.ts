import { isValidWCUrl } from 'src/features/walletConnect/WalletConnect'
import { getValidAddress } from 'src/utils/addresses'

export enum URIType {
  WalletConnectURL = 'walletconnect',
  Address = 'address',
}

export type URIFormat = {
  type: URIType
  value: string
}

export async function getSupportedURI(uri: string): Promise<URIFormat | undefined> {
  if (!uri) {
    return undefined
  }

  const maybeAddress = getValidAddress(uri, true)
  if (maybeAddress) {
    return { type: URIType.Address, value: maybeAddress }
  }

  const maybeMetamaskAddress = getMetamaskAddress(uri)
  if (maybeMetamaskAddress) {
    return { type: URIType.Address, value: maybeMetamaskAddress }
  }

  if (await isValidWCUrl(uri)) {
    return { type: URIType.WalletConnectURL, value: uri }
  }
}

// metamask QR code values have the format "ethereum:<address>"
function getMetamaskAddress(uri: string) {
  const uriParts = uri.split(':')
  if (uriParts.length < 2) {
    return null
  }

  return getValidAddress(uriParts[1], true)
}
