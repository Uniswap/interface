import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { hasURL } from 'utils/urlChecks'

import { useDefaultActiveTokens } from './Tokens'

export function useFilterPossiblyMaliciousPositions(positions: PositionDetails[]): PositionDetails[] {
  const tokens = useDefaultActiveTokens()

  const nonListPositionTokens = useMemo(
    () =>
      Array.from(
        new Set(positions.reduce((acc, position) => acc.concat(position.token0, position.token1), [] as string[]))
      ).filter((address) => !tokens[address]),
    [positions, tokens]
  )

  // todo: fetch non-list position token symbols from chain
  console.log('nonListPositionTokens', nonListPositionTokens)

  return useMemo(
    () =>
      positions.filter((position) => {
        const token0FromList = tokens[position.token0]
        const token1FromList = tokens[position.token1]
        const bothTokensInList = token0FromList && token1FromList
        if (bothTokensInList) return true

        const atLeastOneTokenIsInList = token0FromList || token1FromList
        // todo: check symbols of both (one from list, other from chain)
        const token0HasUrlSymbol = hasURL(token0FromList?.symbol)
        const token1HasUrlSymbol = hasURL(token1FromList?.symbol)
        const maxOneUrlTokenSymbol = token0HasUrlSymbol ? !token1HasUrlSymbol : true
        if (atLeastOneTokenIsInList && maxOneUrlTokenSymbol) return true

        const neitherTokenHasAUrlSymbol = !token0HasUrlSymbol && !token1HasUrlSymbol
        return neitherTokenHasAUrlSymbol
      }),
    [positions, tokens]
  )
}
