import { Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { hasURL } from 'utils/urlChecks'

import { useDefaultActiveTokens } from './Tokens'
import { useTokenContractsConstant } from './useTokenContractsConstant'

function getUniqueAddressesFromPositions(positions: PositionDetails[]): string[] {
  return Array.from(
    new Set(positions.reduce<string[]>((acc, position) => acc.concat(position.token0, position.token1), []))
  )
}

export function useFilterPossiblyMaliciousPositions(positions: PositionDetails[]): PositionDetails[] {
  const activeTokensList = useDefaultActiveTokens()

  const nonListPositionTokenAddresses = useMemo(
    () => getUniqueAddressesFromPositions(positions).filter((address) => !activeTokensList[address]),
    [positions, activeTokensList]
  )

  const symbols = useTokenContractsConstant(nonListPositionTokenAddresses, 'symbol')

  const addressesToSymbol: Record<string, string> = useMemo(() => {
    const result: Record<string, string> = {}
    for (let i = 0; i < nonListPositionTokenAddresses.length; i++) {
      const callResult = symbols[i].result
      if (!callResult) continue
      const address = nonListPositionTokenAddresses[i]
      result[address] = callResult as unknown as string
    }
    return result
  }, [nonListPositionTokenAddresses, symbols])

  return useMemo(
    () =>
      positions.filter((position) => {
        let tokensInListCount = 0
        const token0FromList = activeTokensList[position.token0] as Token | undefined
        const token1FromList = activeTokensList[position.token1] as Token | undefined
        if (token0FromList) tokensInListCount++
        if (token1FromList) tokensInListCount++
        if (tokensInListCount === 2) return true

        const token0IsInList = !!token0FromList
        const token1IsInList = !!token1FromList
        const token0HasUrlSymbol = hasURL(token0IsInList ? token0FromList.symbol : addressesToSymbol[position.token0])
        const token1HasUrlSymbol = hasURL(token1IsInList ? token1FromList.symbol : addressesToSymbol[position.token1])
        const maxOneUrlTokenSymbol = token0HasUrlSymbol ? !token1HasUrlSymbol : true
        if (tokensInListCount >= 1 && maxOneUrlTokenSymbol) return true

        const neitherTokenHasAUrlSymbol = !token0HasUrlSymbol && !token1HasUrlSymbol
        return neitherTokenHasAUrlSymbol
      }),
    [addressesToSymbol, positions, activeTokensList]
  )
}
