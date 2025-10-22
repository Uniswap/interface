import { apolloClient } from 'appGraphql/data/apollo/client'
import { gqlTokenToCurrencyInfo } from 'appGraphql/data/types'
import { apolloQueryOptions } from 'appGraphql/data/util'
import { useQueries } from '@tanstack/react-query'
import { GraphQLApi } from '@universe/api'
import { useAccount } from 'hooks/useAccount'
import { useTokenContractsConstant } from 'hooks/useTokenContractsConstant'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hasURL } from 'utils/urlChecks'

function getUniqueAddressesFromPositions(positions: PositionDetails[]): string[] {
  return Array.from(
    new Set(positions.reduce<string[]>((acc, position) => acc.concat(position.token0, position.token1), [])),
  )
}

function getPositionCurrencyInfosQueryOptions(position: PositionDetails, chainId: UniverseChainId) {
  return apolloQueryOptions({
    queryKey: [ReactQueryCacheKey.PositionCurrencyInfo, position],
    queryFn: async () => {
      const queries = [
        apolloClient.query<GraphQLApi.TokenQuery>({
          query: GraphQLApi.TokenDocument,
          variables: {
            address: position.token0,
            chain: toGraphQLChain(chainId),
          },
          fetchPolicy: 'cache-first',
        }),
        apolloClient.query<GraphQLApi.TokenQuery>({
          query: GraphQLApi.TokenDocument,
          variables: {
            address: position.token1,
            chain: toGraphQLChain(chainId),
          },
          fetchPolicy: 'cache-first',
        }),
      ]
      const [currency0, currency1] = await Promise.all(queries)
      return {
        position,
        currency0Info: gqlTokenToCurrencyInfo(currency0.data.token as GraphQLApi.Token),
        currency1Info: gqlTokenToCurrencyInfo(currency1.data.token as GraphQLApi.Token),
      }
    },
  })
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
  const { chainId } = useAccount()
  const { defaultChainId } = useEnabledChains()
  const nonListPositionTokenAddresses = useMemo(() => getUniqueAddressesFromPositions(positions), [positions])

  const positionCurrencyInfos = useQueries({
    queries: positions.map((position) => getPositionCurrencyInfosQueryOptions(position, chainId ?? defaultChainId)),
  })
  const symbols = useTokenContractsConstant(nonListPositionTokenAddresses, 'symbol')

  const addressesToSymbol: Record<string, string> = useMemo(() => {
    const result: Record<string, string> = {}
    for (let i = 0; i < nonListPositionTokenAddresses.length; i++) {
      const callResult = symbols?.[i]?.result
      if (!callResult) {
        continue
      }
      const address = nonListPositionTokenAddresses[i]
      result[address] = callResult as unknown as string
    }
    return result
  }, [nonListPositionTokenAddresses, symbols])

  return useMemo(() => {
    return positionCurrencyInfos
      .map((result) => {
        if (!result.data) {
          return undefined
        }

        const { currency0Info, currency1Info, position } = result.data
        let tokensInListCount = 0
        if (!currency0Info?.isSpam && currency0Info?.safetyInfo?.tokenList === TokenList.Default) {
          tokensInListCount++
        }
        if (!currency1Info?.isSpam && currency1Info?.safetyInfo?.tokenList === TokenList.Default) {
          tokensInListCount++
        }
        // if both tokens are in the list, then we let both have url symbols (so we don't check)
        if (tokensInListCount === 2) {
          return position
        }

        // check the token symbols to see if they contain a url
        // prioritize the token entity from the list if it exists
        // if the token isn't in the list, then use the data returned from chain calls
        let urlSymbolCount = 0
        if (hasURL(currency0Info?.currency.symbol ?? addressesToSymbol[position.token0])) {
          urlSymbolCount++
        }
        if (hasURL(currency1Info?.currency.symbol ?? addressesToSymbol[position.token1])) {
          urlSymbolCount++
        }
        // if one token is in the list, then one token can have a url symbol
        if (tokensInListCount === 1 && urlSymbolCount < 2) {
          return position
        }

        // if neither token is in the list, then neither can have a url symbol
        return urlSymbolCount === 0 ? position : undefined
      })
      .filter((position): position is PositionDetails => !!position)
  }, [addressesToSymbol, positionCurrencyInfos])
}
