import { ApolloClient } from '@apollo/client'
import { GraphQLApi } from '@universe/api'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { GqlChainId } from 'uniswap/src/features/chains/types'

type UnitagByAddress = Awaited<ReturnType<typeof unitagsApiClient.fetchUnitagsByAddresses>>['usernames']

export async function fetchBalancesAndUnitags({
  addresses,
  apolloClient,
  gqlChains,
}: {
  addresses: Address[]
  apolloClient: ApolloClient<unknown>
  gqlChains: GqlChainId[]
}): Promise<{
  balanceByAddress: AddressTo<number | undefined>
  unitagByAddress: UnitagByAddress
}> {
  if (addresses.length === 0) {
    return { balanceByAddress: {}, unitagByAddress: {} }
  }

  const valueModifiers = addresses.map((addr) => ({
    ownerAddress: addr,
    includeSmallBalances: true,
    includeSpamTokens: false,
  }))

  const [balancesResponse, unitagsResponse] = await Promise.all([
    apolloClient.query<GraphQLApi.PortfoliosTotalValueQuery>({
      query: GraphQLApi.PortfoliosTotalValueDocument,
      variables: { ownerAddresses: addresses, chains: gqlChains, valueModifiers },
    }),
    unitagsApiClient.fetchUnitagsByAddresses({ addresses }),
  ])

  const balanceByAddress = (balancesResponse.data.portfolios ?? []).reduce<AddressTo<number | undefined>>(
    (acc, portfolio) => {
      if (portfolio?.ownerAddress) {
        acc[portfolio.ownerAddress] = portfolio.tokensTotalDenominatedValue?.value
      }
      return acc
    },
    {},
  )

  return {
    balanceByAddress,
    unitagByAddress: unitagsResponse.usernames,
  }
}
