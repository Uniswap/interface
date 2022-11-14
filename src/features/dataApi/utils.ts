import { ApolloError } from '@apollo/client'
import { Token } from '@uniswap/sdk-core'
import { useEffect, useState } from 'react'
import { ChainId } from 'src/constants/chains'
import { Chain, ContractInput, TokenProjectsQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { fromGraphQLChain, toGraphQLChain } from 'src/utils/chainId'
import {
  currencyId,
  CurrencyId,
  currencyIdToChain,
  currencyIdToGraphQLAddress,
} from 'src/utils/currencyId'

// Converts CurrencyId to ContractInput format for GQL token queries
export function currencyIdToContractInput(id: CurrencyId): ContractInput {
  return {
    chain: toGraphQLChain(currencyIdToChain(id) ?? ChainId.Mainnet) ?? Chain.Ethereum,
    address: currencyIdToGraphQLAddress(id),
  }
}

export function tokenProjectToCurrencyInfos(
  tokenProject: TokenProjectsQuery['tokenProjects'],
  chainFilter?: ChainId | null
): CurrencyInfo[] {
  return tokenProject
    ?.flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, name, safetyLevel } = project
        const { chain, address, decimals, symbol } = token
        const chainId = fromGraphQLChain(chain)
        if (!chainId || !decimals || !symbol || !name) return null

        if (chainFilter && chainFilter !== chainId) return null
        const currency = address
          ? new Token(chainId, address, decimals, symbol.toLocaleUpperCase(), name)
          : new NativeCurrency(chainId)

        const currencyInfo: CurrencyInfo = {
          currency,
          currencyId: currencyId(currency),
          logoUrl,
          safetyLevel,
        }

        return currencyInfo
      })
    )
    .filter(Boolean) as CurrencyInfo[]
}

/*
Apollo client clears errors when repolling, so if there's an error and we have a 
polling interval defined for the endpoint, then `error` will flicker between
being defined and not defined. This hook helps persist returned errors when polling
until the network request returns.

Feature request to enable persisted errors: https://github.com/apollographql/apollo-feature-requests/issues/348
*/
export function usePersistedError(loading: boolean, error?: ApolloError) {
  const [persistedError, setPersistedError] = useState<ApolloError>()

  useEffect(() => {
    if (error || !loading) {
      setPersistedError(error)
      return
    }
  }, [error, loading, setPersistedError])

  return persistedError
}
