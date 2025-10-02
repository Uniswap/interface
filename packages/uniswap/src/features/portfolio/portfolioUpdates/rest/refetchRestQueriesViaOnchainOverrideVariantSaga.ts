import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { GQLQueries, SharedQueryClient } from '@universe/api'
import { call, delay } from 'typed-redux-saga'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/data/cache'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { getCurrenciesWithExpectedUpdates } from 'uniswap/src/features/portfolio/portfolioUpdates/getCurrenciesWithExpectedUpdates'
import {
  fetchOnChainBalancesRest,
  OnChainMapRest,
} from 'uniswap/src/features/portfolio/portfolioUpdates/rest/fetchOnChainBalancesRest'
import { getEnabledChainIdsSaga } from 'uniswap/src/features/settings/saga'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// This delay is arbitrary but enough time for our endpoints to reflect updated balances
const REFETCH_DELAY = ONE_SECOND_MS * 3
const FILE_NAME = 'refetchRestQueriesViaOnchainOverrideVariantSaga.ts'

export function getCurrenciesToUpdate(
  transaction: TransactionDetails,
  activeAddress: string | null,
): Set<CurrencyId> | null {
  if (transaction.from !== activeAddress) {
    return null
  }

  const currenciesWithBalanceToUpdate = getCurrenciesWithExpectedUpdates(transaction)
  return currenciesWithBalanceToUpdate && currenciesWithBalanceToUpdate.size > 0 ? currenciesWithBalanceToUpdate : null
}

export function mergeOnChainBalances(
  portfolioData: GetPortfolioResponse | undefined,
  onchainBalancesByCurrencyId: OnChainMapRest,
): GetPortfolioResponse | undefined {
  if (!portfolioData?.portfolio?.balances || onchainBalancesByCurrencyId.size === 0) {
    return portfolioData
  }

  const log = createLogger(FILE_NAME, 'mergeOnChainBalances', '[REST-ITBU]')
  log.debug('Processing cached balances', {
    balanceCount: portfolioData.portfolio.balances.length,
    onchainBalancesCount: onchainBalancesByCurrencyId.size,
  })

  // Track which currencies we've updated
  const updatedCurrencyIds = new Set<CurrencyId>()

  // Must return a new object for cache to be updated
  const updatedData = portfolioData.clone()

  // Track balances to remove
  const balancesToRemove: Balance[] = []

  // Update balances in the cloned data
  updatedData.portfolio?.balances.forEach((balance) => {
    if (!balance.token?.chainId || !balance.token.address) {
      return
    }

    const chainId = balance.token.chainId
    const tokenAddress = balance.token.address
    const address = isNativeCurrencyAddress(chainId, tokenAddress) ? getNativeAddress(chainId) : tokenAddress

    const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, address))
    const onchainBalance = onchainBalancesByCurrencyId.get(currencyId)

    if (balance.amount && onchainBalance?.amount?.amount !== undefined) {
      const oldQuantity = balance.amount.amount || 0
      const newQuantity = onchainBalance.amount.amount
      const rawBalance = onchainBalance.amount.raw || ''

      // Update the balance amount
      balance.amount.amount = newQuantity
      balance.amount.raw = rawBalance

      // Update USD value proportionally if we had a previous value
      if (oldQuantity > 0 && balance.valueUsd) {
        balance.valueUsd = (balance.valueUsd * newQuantity) / oldQuantity
      }

      // If balance is now zero, mark it for removal
      if (newQuantity <= 0) {
        balancesToRemove.push(balance)
        log.debug(`Marking balance for removal ${currencyId}`, {
          oldQuantity,
          newQuantity,
        })
      }

      updatedCurrencyIds.add(currencyId)
      onchainBalancesByCurrencyId.delete(currencyId)

      log.debug(`Updated balance for ${currencyId}`, {
        oldQuantity,
        newQuantity,
        newValueUsd: balance.valueUsd,
      })
    }
  })

  // Remove any balances that have become zero
  if (balancesToRemove.length > 0 && updatedData.portfolio) {
    updatedData.portfolio.balances = updatedData.portfolio.balances.filter(
      (balance) => !balancesToRemove.includes(balance),
    )
    log.debug(`Removed ${balancesToRemove.length} balance(s) from portfolio`)
  }

  // If there are any tokens left in `onchainBalancesByCurrencyId`, it means the user swapped for a new token so we need to create new balance entries.
  if (onchainBalancesByCurrencyId.size > 0) {
    log.debug('New token balance creation', {
      updatedCurrencies: updatedCurrencyIds.size,
      remainingCurrencies: onchainBalancesByCurrencyId.size,
    })

    const newBalances: Balance[] = []

    Array.from(onchainBalancesByCurrencyId).forEach(([currencyId, onchainBalance]) => {
      const onchainQuantity = onchainBalance.amount?.amount

      if (onchainQuantity === undefined) {
        log.warn('No `onchainBalance.quantity` found for token', { currencyId })
        return
      }

      const newBalance = new Balance(onchainBalance)
      newBalances.push(newBalance)
    })

    // Add new balances to the portfolio
    if (newBalances.length > 0 && updatedData.portfolio) {
      updatedData.portfolio.balances = [...updatedData.portfolio.balances, ...newBalances]

      log.debug(`Added ${newBalances.length} new balances to portfolio`)
    }
  }

  return updatedData
}

export function* refetchRestQueriesViaOnchainOverrideVariant({
  transaction,
  activeAddress,
  apolloClient,
}: {
  transaction: TransactionDetails
  activeAddress: string | null
  apolloClient: ApolloClient<NormalizedCacheObject>
}): Generator {
  const currenciesWithBalanceToUpdate = getCurrenciesToUpdate(transaction, activeAddress)

  if (!activeAddress || !currenciesWithBalanceToUpdate) {
    return
  }

  const log = createLogger(FILE_NAME, 'refetchRestQueriesViaOnchainOverrideVariant', '[REST-ITBU]')
  log.debug('Currencies to update detected', {
    currencyIds: Array.from(currenciesWithBalanceToUpdate),
    count: currenciesWithBalanceToUpdate.size,
  })

  // Build query
  const { chains: chainIds } = yield* call(getEnabledChainIdsSaga)
  const portfolioQuery = getPortfolioQuery({ input: { evmAddress: activeAddress, chainIds } })

  // Update the cache with fresh on-chain balances
  yield* call(updatePortfolioCache, {
    apolloClient,
    ownerAddress: activeAddress,
    currencyIds: currenciesWithBalanceToUpdate,
    portfolioQuery,
  })

  // Wait before invalidating and refetching queries
  yield* delay(REFETCH_DELAY)

  // Once NFTs are migrated to REST we won't need to do this
  yield* call([apolloClient, apolloClient.refetchQueries], { include: [GQLQueries.NftsTab] })

  yield* call([SharedQueryClient, SharedQueryClient.invalidateQueries], {
    queryKey: portfolioQuery.queryKey,
  })
}

function* updatePortfolioCache({
  apolloClient,
  ownerAddress,
  currencyIds,
  portfolioQuery,
}: {
  apolloClient: ApolloClient<NormalizedCacheObject>
  ownerAddress: string
  currencyIds: Set<CurrencyId>
  portfolioQuery: ReturnType<typeof getPortfolioQuery>
}) {
  const log = createLogger(FILE_NAME, 'updatePortfolioCache', '[REST-ITBU]')
  log.debug(`updatePortfolioCache with ${currencyIds.size} currencyIds`, { currencyIds })

  const cachedPortfolioData = SharedQueryClient.getQueryData(portfolioQuery.queryKey)

  if (!cachedPortfolioData?.portfolio) {
    log.warn('No cached portfolio data found')
    return
  }

  try {
    const onchainBalancesByCurrencyId = yield* call(fetchOnChainBalancesRest, {
      apolloClient,
      cachedPortfolio: cachedPortfolioData.portfolio,
      accountAddress: ownerAddress,
      currencyIds,
    })

    log.debug('On-chain balance fetching completed', { fetchedBalances: onchainBalancesByCurrencyId.size })

    // Update the cached portfolio data with fresh on-chain balances
    if (onchainBalancesByCurrencyId.size > 0) {
      log.debug('Updating cached portfolio balances')

      SharedQueryClient.setQueryData(portfolioQuery.queryKey, (oldData: GetPortfolioResponse | undefined) => {
        return mergeOnChainBalances(oldData, onchainBalancesByCurrencyId)
      })

      log.debug('Successfully updated react-query cache with fresh balances')
    } else {
      log.debug('No balance updates to apply or no cached data available')
    }
  } catch (error) {
    log.error(error, {
      ownerAddress,
      currencyIds: Array.from(currencyIds),
      message: 'Error fetching on-chain balances',
    })
  }

  log.debug('Cache update completed', { ownerAddress, currencyIds: Array.from(currencyIds) })
}
