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

  const addressesToSymbol: Record<string, string | undefined> = useMemo(
    () =>
      nonListPositionTokenAddresses.reduce(
        (acc, address, i) => ({
          ...acc,
          [address]: symbols[i].result as string | undefined,
        }),
        {}
      ),
    [nonListPositionTokenAddresses, symbols]
  )
  return useMemo(
    () =>
      positions.filter((position) => {
        const token0FromList = activeTokensList[position.token0] as Token | undefined
        const token1FromList = activeTokensList[position.token1] as Token | undefined
        const bothTokensInList = token0FromList && token1FromList
        if (bothTokensInList) return true

        const token0IsInList = !!token0FromList
        const token1IsInList = !!token1FromList
        const atLeastOneTokenIsInList = token0IsInList || token1IsInList
        const token0HasUrlSymbol = hasURL(token0IsInList ? token0FromList.symbol : addressesToSymbol[position.token0])
        const token1HasUrlSymbol = hasURL(token1IsInList ? token1FromList.symbol : addressesToSymbol[position.token1])
        const maxOneUrlTokenSymbol = token0HasUrlSymbol ? !token1HasUrlSymbol : true
        if (atLeastOneTokenIsInList && maxOneUrlTokenSymbol) return true

        const neitherTokenHasAUrlSymbol = !token0HasUrlSymbol && !token1HasUrlSymbol
        return neitherTokenHasAUrlSymbol
      }),
    [addressesToSymbol, positions, activeTokensList]
  )
}
