import { Token } from '@uniswap/sdk-core'
import { graphql } from 'babel-plugin-relay/macro'
import { useMemo } from 'react'
import { useLazyLoadQuery } from 'react-relay'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { tokenProjectsQuery } from 'src/features/dataApi/__generated__/tokenProjectsQuery.graphql'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { fromGraphQLChain, toGraphQLChain } from 'src/utils/chainId'
import {
  currencyId,
  CurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
} from 'src/utils/currencyId'

const query = graphql`
  query tokenProjectsQuery($contracts: [ContractInput!]!) {
    tokenProjects(contracts: $contracts) {
      tokens {
        chain
        address
        decimals
        name
        symbol
      }
      logoUrl
    }
  }
`

/**
 * Fetches token information as CurrencyInfo from currencyIds. When used, wrap component
 * with Suspense.
 */

export function useTokenProjects(currencyIds: CurrencyId[]): CurrencyInfo[] {
  const contracts = currencyIds.map((id) => {
    return {
      chain: toGraphQLChain(currencyIdToChain(id) ?? ChainId.Mainnet) ?? 'ETHEREUM',
      address: currencyIdToAddress(id),
    }
  })

  const data = useLazyLoadQuery<tokenProjectsQuery>(query, {
    contracts,
  })

  return useMemo(() => {
    if (!data || !data.tokenProjects) return EMPTY_ARRAY

    const tokens = data.tokenProjects
      .flatMap((project) =>
        project?.tokens.map((token) => {
          const { chain, address, decimals, symbol, name } = token
          const chainId = fromGraphQLChain(chain)
          if (!chainId || !decimals || !symbol || !name) return null

          const currency = address
            ? new Token(chainId, address, decimals, symbol.toLocaleUpperCase(), name)
            : new NativeCurrency(chainId)

          const currencyInfo: CurrencyInfo = {
            currency,
            currencyId: currencyId(currency),
            logoUrl: project.logoUrl,
          }

          return currencyInfo
        })
      )
      .filter(Boolean) as CurrencyInfo[]

    return tokens
  }, [data])
}
