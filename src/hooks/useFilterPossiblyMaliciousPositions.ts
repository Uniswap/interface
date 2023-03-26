import { Interface } from '@ethersproject/abi'
import { Token } from '@uniswap/sdk-core'
import ERC20ABI from 'abis/erc20.json'
import { Erc20Interface } from 'abis/types/Erc20'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { hasURL } from 'utils/urlChecks'

import { useDefaultActiveTokens } from './Tokens'

const ERC20Interface = new Interface(ERC20ABI) as Erc20Interface

export function useFilterPossiblyMaliciousPositions(positions: PositionDetails[]): PositionDetails[] {
  const tokenList = useDefaultActiveTokens()

  const nonListPositionTokenAddresses = useMemo(
    () =>
      Array.from(
        new Set(positions.reduce((acc, position) => acc.concat(position.token0, position.token1), [] as string[]))
      ).filter((address) => !tokenList[address]),
    [positions, tokenList]
  )

  // todo: fetch non-list position token symbols from chain
  console.log('nonListPositionTokens', nonListPositionTokenAddresses)

  const results = useMultipleContractSingleData(nonListPositionTokenAddresses, ERC20Interface, 'symbol')
  const addressesToSymbol: Record<string, string | undefined> = useMemo(
    () =>
      nonListPositionTokenAddresses.reduce(
        (acc, address, i) => ({
          ...acc,
          [address]: results[i].result as string | undefined,
        }),
        {}
      ),
    [nonListPositionTokenAddresses, results]
  )
  return useMemo(
    () =>
      positions.filter((position) => {
        const token0FromList = tokenList[position.token0] as Token | undefined
        const token1FromList = tokenList[position.token1] as Token | undefined
        const bothTokensInList = token0FromList && token1FromList
        if (bothTokensInList) return true

        const token0IsInList = !!token0FromList
        const token1IsInList = !!token1FromList
        const atLeastOneTokenIsInList = token0IsInList || token1IsInList
        // todo: check symbols of both (one from list, other from chain)
        const token0HasUrlSymbol = hasURL(token0IsInList ? token0FromList.symbol : addressesToSymbol[position.token0])
        const token1HasUrlSymbol = hasURL(token1IsInList ? token1FromList.symbol : addressesToSymbol[position.token1])
        const maxOneUrlTokenSymbol = token0HasUrlSymbol ? !token1HasUrlSymbol : true
        if (atLeastOneTokenIsInList && maxOneUrlTokenSymbol) return true

        const neitherTokenHasAUrlSymbol = !token0HasUrlSymbol && !token1HasUrlSymbol
        return neitherTokenHasAUrlSymbol
      }),
    [addressesToSymbol, positions, tokenList]
  )
}
