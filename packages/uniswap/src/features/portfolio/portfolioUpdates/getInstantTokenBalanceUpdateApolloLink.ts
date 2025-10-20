import { ApolloCache, ApolloLink, NormalizedCacheObject } from '@apollo/client'
import { asyncMap, Reference } from '@apollo/client/utilities'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'
import { GQLQueries, GraphQLApi } from '@universe/api'
import { Buffer } from 'buffer'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { fetchOnChainBalances } from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { makeSelectTokenBalanceOverridesForWalletAddress } from 'uniswap/src/features/portfolio/slice/selectors'
import {
  removeExpiredBalanceOverrides,
  removeTokenFromBalanceOverride,
} from 'uniswap/src/features/portfolio/slice/slice'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

const APPROXIMATE_EQUALITY_THRESHOLD_PERCENT = 0.02 // 2%

export function getInstantTokenBalanceUpdateApolloLink({ reduxStore }: { reduxStore: ToolkitStore }): ApolloLink {
  return new ApolloLink((operation, forward) => {
    if (operation.operationName !== GQLQueries.PortfolioBalances) {
      return forward(operation)
    }

    return asyncMap(forward(operation), async (response) => {
      try {
        const walletAddress = operation.variables.ownerAddress as string

        reduxStore.dispatch(removeExpiredBalanceOverrides())
        const selectTokenBalanceOverridesForWalletAddress = makeSelectTokenBalanceOverridesForWalletAddress()
        const tokenBalanceOverrides = selectTokenBalanceOverridesForWalletAddress(reduxStore.getState(), walletAddress)

        if (!tokenBalanceOverrides) {
          return response
        }

        logger.debug(
          'getInstantTokenBalanceUpdateApolloLink.ts',
          'getInstantTokenBalanceUpdateApolloLink',
          '[ITBU] Maybe overriding token balance in apollo response',
          tokenBalanceOverrides,
        )

        if (!response.data?.portfolios) {
          logger.warn(
            'getInstantTokenBalanceUpdateApolloLink.ts',
            'getInstantTokenBalanceUpdateApolloLink',
            '[ITBU] Unexpected response from `PortfolioBalances` query',
            { response },
          )
          return response
        }

        const data = response.data as Maybe<{ portfolios: Array<GraphQLApi.Portfolio> }>
        const tokenBalances = data?.portfolios[0]?.tokenBalances

        if (!tokenBalances) {
          logger.warn(
            'getInstantTokenBalanceUpdateApolloLink.ts',
            'getInstantTokenBalanceUpdateApolloLink',
            '[ITBU] No `tokenBalances` array found in `PortfolioBalances` response',
            { response },
          )
          return response
        }

        const { cache: apolloCache } = operation.getContext() as { cache: ApolloCache<NormalizedCacheObject> }

        const onchainBalancesByCurrencyId = await fetchOnChainBalances({
          apolloCache,
          cachedPortfolio: data.portfolios[0],
          accountAddress: walletAddress,
          currencyIds: new Set(Object.keys(tokenBalanceOverrides)),
        })

        const tokenBalanceAlreadyExists: Record<string, boolean> = {}

        tokenBalances.forEach((tokenBalance) => {
          if (!tokenBalance) {
            return
          }

          const chainId = fromGraphQLChain(tokenBalance.token?.chain)

          if (!chainId) {
            logger.warn(
              'getInstantTokenBalanceUpdateApolloLink.ts',
              'getInstantTokenBalanceUpdateApolloLink',
              '[ITBU] No `chain` found for token',
              { tokenBalance },
            )
            return
          }

          const tokenAddress = tokenBalance.token?.address ?? getNativeAddress(chainId)
          const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, tokenAddress))

          const tokenBalanceOverride = tokenBalanceOverrides[currencyId]

          if (!tokenBalanceOverride) {
            return
          }

          tokenBalanceAlreadyExists[currencyId] = true

          const onchainBalance = onchainBalancesByCurrencyId.get(currencyId)

          if (!onchainBalance?.quantity) {
            logger.warn(
              'getInstantTokenBalanceUpdateApolloLink.ts',
              'getInstantTokenBalanceUpdateApolloLink',
              '[ITBU] No `onchainBalance.quantity` found for token',
              { currencyId, walletAddress },
            )
            return
          }

          const onchainQuantity = onchainBalance.quantity
          const cachedQuantity = tokenBalance.quantity

          // The backend seems to be truncating some decimals for certain tokens,
          // so instead of checking for exact equality, we check if the quantities are "aproximately" equal.
          const areQuantitiesAproximatelyEqual =
            typeof cachedQuantity === 'number'
              ? Math.abs(onchainQuantity - cachedQuantity) / cachedQuantity <= APPROXIMATE_EQUALITY_THRESHOLD_PERCENT
              : false

          if (areQuantitiesAproximatelyEqual) {
            logger.debug(
              'getInstantTokenBalanceUpdateApolloLink.ts',
              'getInstantTokenBalanceUpdateApolloLink',
              '[ITBU] Quantities are aproximately equal, removing from store',
              { cachedQuantity, onchainQuantity },
            )

            reduxStore.dispatch(
              removeTokenFromBalanceOverride({
                ownerAddress: walletAddress,
                chainId,
                tokenAddress,
              }),
            )

            return
          }

          tokenBalance.quantity = onchainQuantity

          logger.debug(
            'getInstantTokenBalanceUpdateApolloLink.ts',
            'getInstantTokenBalanceUpdateApolloLink',
            '[ITBU] Overriding quantity',
            { cachedQuantity, onchainQuantity },
          )

          if (cachedQuantity && tokenBalance.denominatedValue?.value) {
            tokenBalance.denominatedValue = {
              ...tokenBalance.denominatedValue,
              value: (tokenBalance.denominatedValue.value * onchainQuantity) / cachedQuantity,
            }
          }
        })

        if (tokenBalanceOverrides.length === tokenBalanceAlreadyExists.length) {
          return response
        }

        const missingTokenBalances = Object.keys(tokenBalanceOverrides).filter(
          (currencyId) => !tokenBalanceAlreadyExists[currencyId],
        )

        missingTokenBalances.forEach((currencyId) => {
          const onchainBalanceQuantity = onchainBalancesByCurrencyId.get(currencyId)?.quantity
          const denominatedValue = onchainBalancesByCurrencyId.get(currencyId)?.denominatedValue ?? null

          if (onchainBalanceQuantity === undefined) {
            logger.warn(
              'getInstantTokenBalanceUpdateApolloLink.ts',
              'getInstantTokenBalanceUpdateApolloLink',
              '[ITBU] No `onchainBalance.quantity` found for token',
              { currencyId, walletAddress },
            )
            return
          }

          const newTokenBalance = createTokenBalance({
            apolloCache,
            ownerAddress: walletAddress,
            currencyId,
            onchainBalanceQuantity,
            denominatedValue,
          })

          if (!newTokenBalance) {
            // This shouldn't happen, but if it does, we're already logging it in `createTokenBalance`.
            return
          }

          tokenBalances.push(newTokenBalance)
        })

        return response
      } catch (error) {
        logger.error(error, {
          tags: {
            file: 'getInstantTokenBalanceUpdateApolloLink.ts',
            function: 'getInstantTokenBalanceUpdateApolloLink',
          },
        })

        return response
      }
    })
  })
}

export function createTokenBalanceRef({
  apolloCache,
  ownerAddress,
  currencyId,
  onchainBalanceQuantity,
  denominatedValue,
}: {
  apolloCache: ApolloCache<NormalizedCacheObject>
  ownerAddress: Address
  currencyId: CurrencyId
  onchainBalanceQuantity: number
  denominatedValue: { value: number; currency: string } | null
}): Reference | null {
  const token = apolloCache.readQuery<GraphQLApi.TokenQuery>({
    query: GraphQLApi.TokenDocument,
    variables: currencyIdToContractInput(currencyId),
  })?.token

  if (!token) {
    logger.warn('getInstantTokenBalanceUpdateApolloLink.ts', 'createTokenBalance', '[ITBU] No `token` found', {
      currencyId,
    })
    return null
  }

  // This must match our graphql backend ID generation.
  const tokenBalanceId = generateEntityId('TokenBalance', [ownerAddress, token.id, GraphQLApi.Currency.Usd])

  logger.debug(
    'getInstantTokenBalanceUpdateApolloLink.ts',
    'createTokenBalanceRef',
    `[ITBU]Calling apolloCache.writeFragment for ${currencyId}`,
    {
      onchainBalanceQuantity,
      denominatedValue,
    },
  )

  const newTokenBalanceRef = apolloCache.writeFragment({
    data: {
      __typename: 'TokenBalance' satisfies GraphQLApi.TokenBalance['__typename'],
      id: tokenBalanceId,
      quantity: onchainBalanceQuantity,
      denominatedValue: denominatedValue
        ? {
            __typename: 'Amount' satisfies GraphQLApi.Amount['__typename'],
            value: denominatedValue.value,
            currency: denominatedValue.currency,
          }
        : null,
      isHidden: false,
      token,
      tokenProjectMarket: {
        relativeChange24: null,
      },
    },
    fragment: GraphQLApi.TokenBalancePartsFragmentDoc,
    fragmentName: 'TokenBalanceParts',
  })

  if (!newTokenBalanceRef) {
    logger.warn(
      'getInstantTokenBalanceUpdateApolloLink.ts',
      'createTokenBalanceRef',
      '[ITBU] Failed to write `newTokenBalanceRef`',
      {
        tokenBalanceId,
        ownerAddress,
        currencyId,
      },
    )
    return null
  }

  return newTokenBalanceRef
}

function createTokenBalance({
  apolloCache,
  ownerAddress,
  currencyId,
  onchainBalanceQuantity,
  denominatedValue,
}: Parameters<typeof createTokenBalanceRef>[0]): GraphQLApi.TokenBalance | null {
  const newTokenBalanceRef = createTokenBalanceRef({
    apolloCache,
    ownerAddress,
    currencyId,
    onchainBalanceQuantity,
    denominatedValue,
  })

  if (!newTokenBalanceRef) {
    return null
  }

  const newTokenBalance = apolloCache.readFragment<GraphQLApi.TokenBalance>({
    id: apolloCache.identify(newTokenBalanceRef),
    fragment: GraphQLApi.TokenBalancePartsFragmentDoc,
    fragmentName: 'TokenBalanceParts',
  })

  if (!newTokenBalance) {
    logger.warn(
      'getInstantTokenBalanceUpdateApolloLink.ts',
      'createTokenBalance',
      '[ITBU] Failed to read `newTokenBalance` from cache',
      { currencyId, ownerAddress },
    )
    return null
  }

  return newTokenBalance
}

// Copy/pasted from our graphql backend
function generateEntityId(typeName: string, identifiers: Array<string | bigint | number | null>): string {
  const id = identifiers
    .map((x) => {
      return x === null ? 'null' : x // we allow null identifiers because null is a valid value for addresses (ex. native eth)
    })
    .join('_')
  return Buffer.from(`${typeName}:${id}`).toString('base64')
}
