import { Percent } from '@uniswap/sdk-core'
import { useTheme } from 'styled-components'
import { getPriceImpactWarning } from 'utils/prices'

/** Returns the theme color associated with the input percentage's price impact tier */
export function useWarningColor(percent?: Percent) {
  const theme = useTheme()
  if (!percent) return undefined

  switch (getPriceImpactWarning(percent)) {
    case 'error':
      return theme.accentFailure
    case 'warning':
      return theme.accentWarning
    default:
      return undefined
  }
}
