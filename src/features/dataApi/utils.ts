import { Token } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { Chain, ContractInput, TopTokensQuery } from 'src/data/__generated__/types-and-hooks'
import { CurrencyInfo, SafetyLevel } from 'src/features/dataApi/types'
import { SafetyLevel as GraphQLSafteyLevel } from 'src/features/dataApi/__generated__/tokenProjectsQuery.graphql'
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
  tokenProject: TopTokensQuery['topTokenProjects'],
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
          safetyLevel: fromGraphQLSafetyLevel(safetyLevel),
        }

        return currencyInfo
      })
    )
    .filter(Boolean) as CurrencyInfo[]
}

// Converts return value for SafetyLevel from GQL to custom enum for easier comparison.
// Use anywhere where we reference the return value of SafetyLevel on a `TokenProject` from api.
export function fromGraphQLSafetyLevel(
  safetyLevel: NullUndefined<GraphQLSafteyLevel>
): SafetyLevel | null {
  switch (safetyLevel) {
    case 'MEDIUM_WARNING':
      return SafetyLevel.Medium
    case 'STRONG_WARNING':
      return SafetyLevel.Strong
    case 'BLOCKED':
      return SafetyLevel.Blocked
    case 'VERIFIED':
      return SafetyLevel.Verified
    default:
      return null
  }
}
