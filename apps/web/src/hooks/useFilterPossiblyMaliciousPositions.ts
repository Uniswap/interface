import { useWeb3React } from '@web3-react/core'
import { useCallback, useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { hasURL } from 'utils/urlChecks'

import { apolloClient } from 'graphql/data/apollo/client'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { chainIdToBackendName } from 'graphql/data/util'
import { useQuery } from 'react-query'
import {
  SafetyLevel,
  SimpleTokenDocument,
  SimpleTokenQuery,
  Token,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useTokenContractsConstant } from './useTokenContractsConstant'

function getUniqueAddressesFromPositions(positions: PositionDetails[]): string[] {
  return Array.from(
    new Set(positions.reduce<string[]>((acc, position) => acc.concat(position.token0, position.token1), []))
  )
}
/**
 * This function is an attempt to filter out an observed phishing attack from LP list UIs.
 * Attackers would airdrop valueless LP positions with urls in the symbol to render phishing sites into users' LP position list view.
 *
 * Our approach to filtering these out without naively prohibiting all valid URL symbols is to:
 * 1. allow any pair if both tokens are in the supported list
 * 2. allow one url if one token is in the supported list
 * 3. allow no urls if neither token is in the supported list
 *
 * The hope is that this approach removes the cheapest version of the attack without punishing non-malicious url symbols
 */
export function useFilterPossiblyMaliciousPositions(positions: PositionDetails[]): PositionDetails[] {
  const { chainId } = useWeb3React()
  const nonListPositionTokenAddresses = useMemo(() => getUniqueAddressesFromPositions(positions), [positions])

  const positionCurrencyInfoFetcher = useCallback(async () => {
    return await Promise.all(
      positions.map(async (position) => {
        const queries = [
          apolloClient.query<SimpleTokenQuery>({
            query: SimpleTokenDocument,
            variables: {
              address: position.token0,
              chain: chainIdToBackendName(chainId),
            },
          }),
          apolloClient.query<SimpleTokenQuery>({
            query: SimpleTokenDocument,
            variables: {
              address: position.token1,
              chain: chainIdToBackendName(chainId),
            },
          }),
        ]
        const [currency0, currency1] = await Promise.all(queries)
        return {
          position,
          currency0Info: gqlTokenToCurrencyInfo(currency0.data.token as Token),
          currency1Info: gqlTokenToCurrencyInfo(currency1.data.token as Token),
        }
      })
    )
  }, [chainId, positions])
  const { data: positionCurrencyInfos } = useQuery(
    `PositionCurrencyInfo-${JSON.stringify(positions)}`,
    positionCurrencyInfoFetcher
  )

  const symbolCallStates = useTokenContractsConstant(nonListPositionTokenAddresses, 'symbol')

  const addressesToSymbol: Record<string, string> = useMemo(() => {
    const result: Record<string, string> = {}
    for (let i = 0; i < nonListPositionTokenAddresses.length; i++) {
      const callResult = symbolCallStates[i]?.result
      if (!callResult) continue
      const address = nonListPositionTokenAddresses[i]
      result[address] = callResult as unknown as string
    }
    return result
  }, [nonListPositionTokenAddresses, symbolCallStates])

  return useMemo(
    () =>
      positionCurrencyInfos
        ?.filter(({ currency0Info, currency1Info, position }) => {
          let tokensInListCount = 0
          if (!currency0Info?.isSpam && currency0Info?.safetyLevel === SafetyLevel.Verified) tokensInListCount++
          if (!currency1Info?.isSpam && currency1Info?.safetyLevel === SafetyLevel.Verified) tokensInListCount++
          // if both tokens are in the list, then we let both have url symbols (so we don't check)
          if (tokensInListCount === 2) return true

          // check the token symbols to see if they contain a url
          // prioritize the token entity from the list if it exists
          // if the token isn't in the list, then use the data returned from chain calls
          let urlSymbolCount = 0
          if (hasURL(currency0Info?.currency?.symbol ?? addressesToSymbol[position.token0])) urlSymbolCount++
          if (hasURL(currency1Info?.currency?.symbol ?? addressesToSymbol[position.token1])) urlSymbolCount++
          // if one token is in the list, then one token can have a url symbol
          if (tokensInListCount === 1 && urlSymbolCount < 2) return true

          // if neither token is in the list, then neither can have a url symbol
          return urlSymbolCount === 0
        })
        .map(({ position }) => position) ?? [],
    [addressesToSymbol, positionCurrencyInfos]
  )
}
