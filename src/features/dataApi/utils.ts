import { Token } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { CurrencyInfo, GQLTokenProject } from 'src/features/dataApi/types'
import { ContractInput } from 'src/features/dataApi/__generated__/tokenProjectsQuery.graphql'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { fromGraphQLChain, toGraphQLChain } from 'src/utils/chainId'
import {
  currencyId,
  CurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
  isNativeCurrencyAddress,
} from 'src/utils/currencyId'

export function currencyIdToContractInput(id: CurrencyId): ContractInput {
  const address = currencyIdToAddress(id)
  const chainId = currencyIdToChain(id)
  return {
    chain: toGraphQLChain(chainId ?? ChainId.Mainnet) ?? 'ETHEREUM',
    // TODO: As of 9/12/22, Data API only allows fetching native currency using null address for Ethereum
    // Should remove the chainId equals Mainnet check when Data API accepts null address value for L2 chains
    address: isNativeCurrencyAddress(address) && chainId === ChainId.Mainnet ? null : address,
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
