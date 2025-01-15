import { ApolloCache, ApolloLink, NormalizedCacheObject } from '@apollo/client'
import { Reference, asyncMap } from '@apollo/client/utilities'
// eslint-disable-next-line no-restricted-imports
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  Currency,
  Portfolio,
  TokenBalance,
  TokenBalancePartsFragmentDoc,
  TokenDocument,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GQLQueries } from 'uniswap/src/data/graphql/uniswap-data-api/queries'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils'
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
        )

        if (!response?.data?.portfolios) {
          logger.warn(
            'getInstantTokenBalanceUpdateApolloLink.ts',
            'getInstantTokenBalanceUpdateApolloLink',
            '[ITBU] Unexpected response from `PortfolioBalances` query',
            { response },
          )
          return response
        }

        const data = response.data as Maybe<{ portfolios: Array<Portfolio> }>
        const tokenBalances = data?.portfolios?.[0]?.tokenBalances

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
          accountAddress: walletAddress,
          currencyIds: new Set(Object.keys(tokenBalanceOverrides)),
        })

        logger.debug(
          'getInstantTokenBalanceUpdateApolloLink.ts',
          'getInstantTokenBalanceUpdateApolloLink',
          '[ITBU] Onchain balances fetched',
          { onchainBalancesByCurrencyId },
        )

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
          const currencyId = buildCurrencyId(chainId, tokenAddress).toLowerCase()

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
}: {
  apolloCache: ApolloCache<NormalizedCacheObject>
  ownerAddress: Address
  currencyId: CurrencyId
  onchainBalanceQuantity: number
}): Reference | null {
  const token = apolloCache.readQuery<TokenQuery>({
    query: TokenDocument,
    variables: currencyIdToContractInput(currencyId),
  })?.token

  if (!token) {
    logger.warn('getInstantTokenBalanceUpdateApolloLink.ts', 'createTokenBalance', 'No `token` found', { currencyId })
    return null
  }

  // This must match our graphql backend ID generation.
  const tokenBalanceId = generateEntityId('TokenBalance', [ownerAddress, token.id, Currency.Usd])

  const newTokenBalanceRef = apolloCache.writeFragment({
    data: {
      __typename: 'TokenBalance' satisfies TokenBalance['__typename'],
      id: tokenBalanceId,
      quantity: onchainBalanceQuantity,
      // TODO(WALL-5548): Fetch and calculate USD value for new tokens that are not already in the user's balance.
      denominatedValue: null,
      isHidden: false,
      token,
      tokenProjectMarket: {
        relativeChange24: null,
      },
    },
    fragment: TokenBalancePartsFragmentDoc,
    fragmentName: 'TokenBalanceParts',
  })

  if (!newTokenBalanceRef) {
    logger.warn(
      'getInstantTokenBalanceUpdateApolloLink.ts',
      'createTokenBalance',
      'Failed to write `newTokenBalanceRef`',
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
}: Parameters<typeof createTokenBalanceRef>[0]): TokenBalance | null {
  const newTokenBalanceRef = createTokenBalanceRef({
    apolloCache,
    ownerAddress,
    currencyId,
    onchainBalanceQuantity,
  })

  if (!newTokenBalanceRef) {
    return null
  }

  const newTokenBalance = apolloCache.readFragment<TokenBalance>({
    id: apolloCache.identify(newTokenBalanceRef),
    fragment: TokenBalancePartsFragmentDoc,
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
