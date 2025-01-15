import { ApolloClient, NormalizedCacheObject, Reference } from '@apollo/client'
import { AsStoreObject, isArray, isReference } from '@apollo/client/utilities'
import { call, delay, put } from 'typed-redux-saga'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  Amount,
  PortfolioBalancesDocument,
  PortfolioBalancesQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE } from 'uniswap/src/features/portfolio/portfolioUpdates/constants'
import { fetchOnChainBalances } from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { getCurrenciesWithExpectedUpdates } from 'uniswap/src/features/portfolio/portfolioUpdates/getCurrenciesWithExpectedUpdates'
import { createTokenBalanceRef } from 'uniswap/src/features/portfolio/portfolioUpdates/getInstantTokenBalanceUpdateApolloLink'
import { addTokensToBalanceOverride } from 'uniswap/src/features/portfolio/slice/slice'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const REFETCH_DELAY = ONE_SECOND_MS * 3

export function* refetchGQLQueriesViaOnchainOverrideVariant({
  transaction,
  apolloClient,
  activeAddress,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
  activeAddress: string | null
}): Generator {
  const owner = transaction.from
  const currenciesWithBalanceToUpdate = getCurrenciesWithExpectedUpdates(transaction)

  if (owner !== activeAddress) {
    // We can ignore if the transaction does not belong to the active account.
    return
  }

  if (currenciesWithBalanceToUpdate) {
    // We override the apollo cache with the onchain balances.
    yield* call(modifyLocalCache, {
      apolloClient,
      ownerAddress: activeAddress,
      currencyIds: currenciesWithBalanceToUpdate,
    })
  }

  // When there is a new local tx, we wait `REFETCH_DELAY` and then refetch all queries.
  yield* delay(REFETCH_DELAY)

  // We refetch all queries for the Tokens, NFT and Activity tabs.
  yield* call([apolloClient, apolloClient.refetchQueries], { include: GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE })

  // On every refetch going forward, our custom ApolloLink in `getInstantTokenBalanceUpdateApolloLink.ts` will do another onchain balance check
  // and will continue to override the apollo cache balance until backend balance matches the onchain balance.
}

export function* modifyLocalCache({
  apolloClient,
  ownerAddress,
  currencyIds,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  ownerAddress: string
  currencyIds: Set<CurrencyId>
}) {
  yield* put(
    addTokensToBalanceOverride({
      ownerAddress,
      currencyIds: Array.from(currencyIds),
    }),
  )

  const onchainBalancesByCurrencyId = yield* call(fetchOnChainBalances, {
    apolloCache: apolloClient.cache,
    accountAddress: ownerAddress,
    currencyIds,
  })

  const { gqlChains } = yield* call(getEnabledChainIdsSaga)

  const cachedPortfolio = apolloClient.readQuery<PortfolioBalancesQuery>({
    query: PortfolioBalancesDocument,
    variables: {
      ownerAddress,
      chains: gqlChains,
    },
  })?.portfolios?.[0]

  if (!cachedPortfolio) {
    logger.warn(
      'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
      'modifyLocalCache',
      '[ITBU] No `cachedPortfolio` found',
    )
    return
  }

  apolloClient.cache.modify({
    id: apolloClient.cache.identify(cachedPortfolio),
    fields: {
      tokenBalances(tokenBalancesRefs: Reference | readonly Reference[], { readField }) {
        if (!isArray(tokenBalancesRefs)) {
          return tokenBalancesRefs
        }

        // We first look for an existing `TokenBalance` that we can update.
        tokenBalancesRefs.forEach((tokenBalanceRef) => {
          const tokenRef = readField<Reference>('token', tokenBalanceRef)
          const chainId = fromGraphQLChain(readField('chain', tokenRef))
          const tokenAddress = chainId ? readField<Address>('address', tokenRef) ?? getNativeAddress(chainId) : null

          if (!tokenRef || !chainId || !tokenAddress) {
            return
          }

          const currencyId = buildCurrencyId(chainId, tokenAddress).toLowerCase()
          const onchainQuantity = onchainBalancesByCurrencyId.get(currencyId)?.quantity
          onchainBalancesByCurrencyId.delete(currencyId)

          if (onchainQuantity === undefined) {
            logger.warn(
              'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
              'modifyLocalCache',
              '[ITBU] Unable to override local cache because of missing `onchainQuantity`',
              {
                currencyId,
              },
            )
            return
          }

          const cachedQuantity = readField<number>('quantity', tokenBalanceRef)

          apolloClient.cache.modify({
            id: apolloClient.cache.identify(tokenBalanceRef),
            fields: {
              quantity: () => {
                return onchainQuantity
              },
              denominatedValue: (cachedDenominatedValue: Reference | AsStoreObject<Amount>) => {
                if (!cachedQuantity) {
                  return cachedDenominatedValue
                }

                if (isReference(cachedDenominatedValue)) {
                  // This should never happen unless there's a regression in our apollo cache config.
                  logger.error(new Error('Unexpected `cachedDenominatedValue` as Reference instead of Amount'), {
                    tags: {
                      file: 'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
                      function: 'modifyLocalCache',
                    },
                    extra: {
                      currencyId,
                      cachedDenominatedValue,
                    },
                  })
                  return cachedDenominatedValue
                }

                return {
                  ...cachedDenominatedValue,
                  value: (cachedDenominatedValue.value * onchainQuantity) / cachedQuantity,
                }
              },
            },
          })
        })

        // If there are any tokens left in `onchainBalancesByCurrencyId`, it means the user swapped for a new token so we need to create new `TokenBalance` entries.
        const newTokenBalancesRefs: Reference[] = []

        Array.from(onchainBalancesByCurrencyId).forEach(([currencyId]) => {
          const onchainBalanceQuantity = onchainBalancesByCurrencyId.get(currencyId)?.quantity

          if (onchainBalanceQuantity === undefined) {
            logger.warn(
              'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
              'modifyLocalCache',
              '[ITBU] No `onchainBalance.quantity` found for token',
              { currencyId, ownerAddress },
            )
            return
          }

          const newTokenBalanceRef = createTokenBalanceRef({
            apolloCache: apolloClient.cache,
            ownerAddress,
            currencyId,
            onchainBalanceQuantity,
          })

          if (!newTokenBalanceRef) {
            // This shouldn't happen, but if it does we're already logging this in `createTokenBalanceRef`.
            return
          }

          newTokenBalancesRefs.push(newTokenBalanceRef)
        })

        return newTokenBalancesRefs.length > 0 ? [...tokenBalancesRefs, ...newTokenBalancesRefs] : tokenBalancesRefs
      },
    },
  })
}
