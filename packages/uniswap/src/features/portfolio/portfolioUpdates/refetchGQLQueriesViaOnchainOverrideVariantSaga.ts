import { ApolloClient, NormalizedCacheObject, Reference } from '@apollo/client'
import { AsStoreObject, isArray, isReference } from '@apollo/client/utilities'
import { QueryClient } from '@tanstack/react-query'
import { GraphQLApi } from '@universe/api'
import { call, delay, put } from 'typed-redux-saga'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
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
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

const REFETCH_DELAY = ONE_SECOND_MS * 3

export function* refetchGQLQueriesViaOnchainOverrideVariant({
  transaction,
  apolloClient,
  activeAddress,
  queryClient,
}: {
  transaction: TransactionDetails
  apolloClient: ApolloClient<NormalizedCacheObject>
  activeAddress: string | null
  queryClient?: QueryClient
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
      queryClient,
    })
  }

  // When there is a new local tx, we wait `REFETCH_DELAY` and then refetch all queries.
  yield* delay(REFETCH_DELAY)

  // We refetch all queries for the Tokens, NFT and Activity tabs.
  yield* call([apolloClient, apolloClient.refetchQueries], { include: GQL_QUERIES_TO_REFETCH_ON_TXN_UPDATE })

  // On every refetch going forward, our custom ApolloLink in `getInstantTokenBalanceUpdateApolloLink.ts` will do another onchain balance check
  // and will continue to override the apollo cache balance until backend balance matches the onchain balance.
}

function* modifyLocalCache({
  apolloClient,
  ownerAddress,
  currencyIds,
  queryClient,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  ownerAddress: string
  currencyIds: Set<CurrencyId>
  queryClient?: QueryClient
}) {
  logger.debug(
    'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
    'modifyLocalCache',
    `[ITBU] modifyLocalCache called with ${currencyIds.size} currencyIds`,
    { currencyIds },
  )

  yield* put(
    addTokensToBalanceOverride({
      ownerAddress,
      currencyIds: Array.from(currencyIds),
    }),
  )

  const { gqlChains } = yield* call(getEnabledChainIdsSaga)

  const cachedPortfolio = apolloClient.readQuery<GraphQLApi.PortfolioBalancesQuery>({
    query: GraphQLApi.PortfolioBalancesDocument,
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

  const onchainBalancesByCurrencyId = yield* call(fetchOnChainBalances, {
    apolloCache: apolloClient.cache,
    cachedPortfolio,
    accountAddress: ownerAddress,
    currencyIds,
  })

  if (queryClient) {
    for (const currencyId of currencyIds) {
      queryClient.setQueryData<{ balance?: string }>(
        [ReactQueryCacheKey.OnchainBalances, ownerAddress, currencyId],
        (old) => ({ ...old, balance: onchainBalancesByCurrencyId.get(currencyId)?.rawBalance }),
      )
    }
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
          const tokenAddress = chainId ? (readField<Address>('address', tokenRef) ?? getNativeAddress(chainId)) : null

          if (!tokenRef || !chainId || !tokenAddress) {
            logger.error(new Error('Missing required value: `tokenRef`, `chainId` or `tokenAddress`'), {
              tags: {
                file: 'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
                function: 'modifyLocalCache',
              },
              extra: { tokenRef, chainId, tokenAddress },
            })
            return
          }

          const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, tokenAddress))
          const onchainBalance = onchainBalancesByCurrencyId.get(currencyId)

          if (!onchainBalance) {
            return
          }

          const onchainQuantity = onchainBalance.quantity
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

          const tokenBalanceId = apolloClient.cache.identify(tokenBalanceRef)

          logger.debug(
            'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
            'modifyLocalCache',
            `[ITBU] Calling apolloClient.cache.modify for ${currencyId}`,
            { tokenBalanceRef, tokenBalanceId },
          )

          apolloClient.cache.modify({
            id: tokenBalanceId,
            fields: {
              quantity: () => {
                return onchainQuantity
              },
              denominatedValue: (cachedDenominatedValue: Reference | AsStoreObject<GraphQLApi.Amount> | null) => {
                if (!cachedDenominatedValue) {
                  logger.debug(
                    'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
                    'modifyLocalCache',
                    `[ITBU] No cachedDenominatedValue found for ${currencyId}`,
                  )
                  return cachedDenominatedValue
                }

                if (!cachedQuantity) {
                  logger.debug(
                    'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
                    'modifyLocalCache',
                    `[ITBU] No cachedQuantity found for ${currencyId}`,
                  )
                  return cachedDenominatedValue
                }

                if (isReference(cachedDenominatedValue)) {
                  // This should never happen unless there's a regression in our apollo cache config.
                  logger.error(
                    new Error('Unexpected `cachedDenominatedValue` as Reference instead of GraphQLApi.Amount'),
                    {
                      tags: {
                        file: 'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
                        function: 'modifyLocalCache',
                      },
                      extra: {
                        currencyId,
                        cachedDenominatedValue,
                      },
                    },
                  )
                  return cachedDenominatedValue
                }

                const value = (cachedDenominatedValue.value * onchainQuantity) / cachedQuantity

                logger.debug(
                  'refetchGQLQueriesViaOnchainOverrideVariantSaga.ts',
                  'modifyLocalCache',
                  `[ITBU] Overriding ${currencyId} with $${value}`,
                )

                return {
                  ...cachedDenominatedValue,
                  value,
                }
              },
            },
          })
        })

        // If there are any tokens left in `onchainBalancesByCurrencyId`, it means the user swapped for a new token so we need to create new `TokenBalance` entries.
        const newTokenBalancesRefs: Reference[] = []

        Array.from(onchainBalancesByCurrencyId).forEach(([currencyId]) => {
          const onchainBalanceQuantity = onchainBalancesByCurrencyId.get(currencyId)?.quantity
          const denominatedValue = onchainBalancesByCurrencyId.get(currencyId)?.denominatedValue

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
            denominatedValue: denominatedValue ?? null,
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
