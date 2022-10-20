import { Token } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { CurrencyInfo, GQLTokenProject } from 'src/features/dataApi/types'
import { ContractInput } from 'src/features/dataApi/__generated__/tokenProjectsQuery.graphql'
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
    chain: toGraphQLChain(currencyIdToChain(id) ?? ChainId.Mainnet) ?? 'ETHEREUM',
    address: currencyIdToGraphQLAddress(id),
  }
}

export function tokenProjectToCurrencyInfos(
  tokenProject: readonly (GQLTokenProject | null)[],
  chainFilter?: ChainId | null
): CurrencyInfo[] {
  return tokenProject
    .flatMap((project) =>
      project?.tokens.map((token) => {
        const { logoUrl, name } = project
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
        }

        return currencyInfo
      })
    )
    .filter(Boolean) as CurrencyInfo[]
}
