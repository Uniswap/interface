import { ChainId, CHAIN_INFO } from 'src/constants/chains'

/**
 * Add opacity information to a hex color
 * @param amount opacity value from 0 to 100
 * @param hexColor
 */
export function opacify(amount: number, hexColor: string): string {
  if (hexColor.length !== 7 || !hexColor.startsWith('#')) {
    throw new Error('opacify: provided color was not in hexadecimal format (e.g. #000000)')
  }
  if (amount < 0 || amount > 100) {
    throw new Error('opacify: provided amount should be between 0 and 100')
  }
  return hexColor.slice(0, 7) + amount.toString().slice(0, 2)
}

/** Helper to retrieve foreground and background colors for a given chain */
export function getNetworkColors(chainId: ChainId) {
  const info = CHAIN_INFO[chainId]
  return {
    foreground: info?.primaryColor ?? '#000000',
    background: opacify(10, info?.primaryColor ?? '#000000'),
  }
}
