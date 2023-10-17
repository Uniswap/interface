import gql from 'graphql-tag'

import { TokenQuery, usePortfolioBalancesQuery } from './__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS } from './util'

gql`
  query PortfolioBalances($ownerAddress: String!, $chains: [Chain!]!) {
    portfolios(ownerAddresses: [$ownerAddress], chains: $chains) {
      id
      tokensTotalDenominatedValue {
        id
        value
      }
      tokensTotalDenominatedValueChange(duration: DAY) {
        absolute {
          id
          value
        }
        percentage {
          id
          value
        }
      }
      tokenBalances {
        id
        quantity
        denominatedValue {
          id
          currency
          value
        }
        tokenProjectMarket {
          id
          pricePercentChange(duration: DAY) {
            id
            value
          }
          tokenProject {
            id
            logoUrl
            isSpam
            tokens {
              id
              chain
              address
            }
          }
        }
        token {
          id
          chain
          address
          name
          symbol
          standard
          decimals
        }
      }
    }
  }
`

// import { Chain, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
// /**
//  * Returns all balances indexed by checksummed currencyId for a given address
//  * @param address
//  * @param shouldPoll whether query should poll
//  * NOTE:
//  *  on TokenDetails, useBalances relies rely on usePortfolioBalances but don't need
//  *  polling versions of it. Including polling was causing multiple polling intervals
//  *  to be kicked off with usePortfolioBalances.
//  *  Same with on Token Selector's TokenSearchResultList, since the home screen
//  *  has a usePortfolioBalances polling hook, we don't need to duplicate the
//  *  polling interval when token selector is open
//  * @param hideSmallBalances
//  * @param hideSpamTokens
//  * @param onCompleted
//  * @returns
//  */
// function usePortfolioBalances({
//   address,
//   shouldPoll,
//   onCompleted,
//   fetchPolicy,
// }: {
//   address?: Address
//   shouldPoll?: boolean
//   onCompleted?: () => void
//   fetchPolicy?: WatchQueryFetchPolicy
// }): GqlResult<Record<CurrencyId, PortfolioBalance>> & { networkStatus: NetworkStatus } {
//   const {
//     data: balancesData,
//     loading,
//     networkStatus,
//     refetch,
//     error,
//   } = usePortfolioBalancesQuery({
//     fetchPolicy,
//     notifyOnNetworkStatusChange: true,
//     onCompleted,
//     pollInterval: shouldPoll ? PollingInterval.KindaFast : undefined,
//     variables: address ? { ownerAddress: address } : undefined,
//     skip: !address,
//   })

//   const persistedError = usePersistedError(loading, error)
//   const balancesForAddress = balancesData?.portfolios?.[0]?.tokenBalances

//   const formattedData = useMemo(() => {
//     if (!balancesForAddress) return

//     const byId: Record<CurrencyId, PortfolioBalance> = {}
//     balancesForAddress.forEach((balance) => {
//       const { denominatedValue, token, tokenProjectMarket, quantity } = balance || {}
//       const { address: tokenAddress, chain, decimals, symbol, project } = token || {}
//       const { name, logoUrl, isSpam, safetyLevel } = project || {}
//       const chainId = fromGraphQLChain(chain)

//       // require all of these fields to be defined
//       if (!chainId || !balance || !quantity || !token || !decimals || !symbol) return

//       const currency = tokenAddress
//         ? new Token(chainId, tokenAddress, decimals, symbol, name ?? undefined, /* bypassChecksum:*/ true)
//         : NativeCurrency.onChain(chainId)

//       const id = currencyId(currency)

//       const currencyInfo: CurrencyInfo = {
//         currency,
//         currencyId: currencyId(currency),
//         logoUrl,
//         isSpam,
//         safetyLevel,
//       }

//       const portfolioBalance: PortfolioBalance = {
//         quantity,
//         balanceUSD: denominatedValue?.value,
//         currencyInfo,
//         relativeChange24: tokenProjectMarket?.relativeChange24?.value,
//       }

//       byId[id] = portfolioBalance
//     })

//     return byId
//   }, [balancesForAddress])

//   const retry = useCallback(() => refetch({ ownerAddress: address }), [address, refetch])

//   return {
//     data: formattedData,
//     loading,
//     networkStatus,
//     refetch: retry,
//     error: persistedError,
//   }
// }

// /** Helper hook to retrieve balances for a set of currencies for the active account. */
// function useBalances(currencies: CurrencyId[] | undefined): PortfolioBalance[] | null {
//   const address = useActiveAccountAddressWithThrow()
//   const { data: balances } = usePortfolioBalances({
//     address,
//     shouldPoll: false,
//     fetchPolicy: 'cache-and-network',
//   })

//   return useMemo(() => {
//     if (!currencies || !currencies.length || !balances) return null

//     return currencies.map((id: CurrencyId) => balances[id] ?? null).filter((x): x is PortfolioBalance => Boolean(x))
//   }, [balances, currencies])
// }

/** Helper GQL hook to retrieve balances across chains for a given currency, for the active account. */
export function useCrossChainGqlBalances(tokenQuery: TokenQuery, account?: string) {
  const { data: portfolioBalances } = usePortfolioBalancesQuery({
    skip: !account,
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
    fetchPolicy: 'cache-and-network', // PrefetchBalancesWrapper handles balance fetching/staleness; this component only reads from cache
    errorPolicy: 'all',
  })
  // const { data: portfolioBalances } = useCachedPortfolioBalancesQuery({ account }) // hmm cached?
  const tokenBalances = portfolioBalances?.portfolios?.[0].tokenBalances
  const bridgeInfo = tokenQuery.token?.project?.tokens
  console.log('tokenbalances', tokenBalances)
  console.log('bridgeinfo', bridgeInfo) // why does bridge info flicker... bridge info does not give ETHER across chains as native balance.. also MATIC does not show either crosschain
  const otherChainBalances = tokenBalances?.filter(
    (tokenBalance) =>
      tokenBalance.token?.symbol === tokenQuery.token?.symbol &&
      bridgeInfo?.some((bridgeToken) => bridgeToken.id == tokenBalance.token?.id)
  )
  return otherChainBalances

  // const currentChainBalance = useBalances([currencyId])?.[0] ?? null
  // const currentChainId = currencyIdToChain(currencyId)

  // const bridgedCurrencyIds = useMemo(
  //   () =>
  //     bridgeInfo
  //       ?.map(({ chain, address }) => {
  //         const chainId = fromGraphQLChain(chain)
  //         if (!chainId || chainId === currentChainId) return null
  //         if (!address) return buildNativeCurrencyId(chainId)
  //         return buildCurrencyId(chainId, address)
  //       })
  //       .filter((b): b is string => !!b),

  //   [bridgeInfo, currentChainId]
  // )
  // const otherChainBalances = useBalances(bridgedCurrencyIds)

  // return {
  //   currentChainBalance,
  //   otherChainBalances,
  // }
}
