import { useTheme } from '@shopify/restyle'
import { ChainId } from 'src/constants/chains'
import { Theme } from 'src/styles/theme'
import { assert } from 'src/utils/validation'

/**
 * Add opacity information to a hex color
 * @param amount opacity value from 0 to 100
 * @param hexColor
 */
export function opacify(amount: number, hexColor: string): string {
  if (!hexColor.startsWith('#')) {
    return hexColor
  }

  if (hexColor.length !== 7) {
    throw new Error(
      `opacify: provided color ${hexColor} was not in hexadecimal format (e.g. #000000)`
    )
  }

  if (amount < 0 || amount > 100) {
    throw new Error('opacify: provided amount should be between 0 and 100')
  }

  return hexColor.slice(0, 7) + amount.toString().slice(0, 2)
}

/** Helper to retrieve foreground and background colors for a given chain */
export function useNetworkColors(chainId: ChainId) {
  const theme = useTheme<Theme>()

  const foreground = theme.colors[`chain_${chainId}`]
  assert(foreground, 'Netowrk color is not defined in Theme')

  return {
    foreground,
    background: opacify(10, foreground),
  }
}
