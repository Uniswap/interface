import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Portfolio } from '@uniswap/client-data-api/dist/data/v1/types_pb.d'
import { SharedQueryClient } from '@universe/api'
import { all, call, delay, put } from 'typed-redux-saga'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import {
  doesGetPortfolioQueryMatchAddress,
  getPortfolioQueriesToUpdate,
} from 'uniswap/src/data/apiClients/dataApiService/balances/getPortfolioQueryUtils'
import { doesGetWalletBalancesQueryMatchAddress } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import {
  type BalanceOverrideSnapshots,
  getBalanceOverrideStateForAddress,
  storeBalanceOverrideSnapshots,
} from 'uniswap/src/data/apiClients/dataApiService/balances/portfolioBalanceOverrides'
import { NFT_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/dataApiService/nfts/queries'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import {
  fetchOnChainBalances,
  type OnChainMap,
} from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { getCurrenciesWithExpectedUpdates } from 'uniswap/src/features/portfolio/portfolioUpdates/getCurrenciesWithExpectedUpdates'
import { addTokensToBalanceOverride } from 'uniswap/src/features/portfolio/slice/slice'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// This delay is arbitrary but enough time for our endpoints to reflect updated balances
const REFETCH_DELAY = ONE_SECOND_MS * 3
const FILE_NAME = 'refetchQueriesViaOnchainOverrideVariantSaga.ts'

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
  onchainBalancesByCurrencyId: OnChainMap,
): GetPortfolioResponse | undefined {
  if (!portfolioData?.portfolio?.balances || onchainBalancesByCurrencyId.size === 0) {
    return portfolioData
  }

  const log = createLogger(FILE_NAME, 'mergeOnChainBalances', '[ITBU]')
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

      // Skip zero-balance tokens — these are tokens the user fully swapped out of
      if (onchainQuantity <= 0) {
        log.debug(`Skipping new balance for ${currencyId} with zero/negative quantity`, { onchainQuantity })
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

export function getBalanceOverridesToApply({
  currencyIds,
  fetchedOnchainBalances,
  balanceOverrideSnapshots,
}: {
  currencyIds: Set<CurrencyId>
  fetchedOnchainBalances: OnChainMap
  balanceOverrideSnapshots: BalanceOverrideSnapshots
}): OnChainMap {
  const balancesToApply: OnChainMap = new Map()

  balanceOverrideSnapshots.forEach((balance, currencyId) => {
    if (currencyIds.has(currencyId)) {
      balancesToApply.set(currencyId, balance)
    }
  })

  fetchedOnchainBalances.forEach((balance, currencyId) => {
    balancesToApply.set(currencyId, balance)
  })

  return balancesToApply
}

export type FetchAndMergeOnchainBalancesResult = {
  mergedData: GetPortfolioResponse
  fetchedOnchainBalances: OnChainMap
  appliedBalanceSnapshots: BalanceOverrideSnapshots
}

export async function fetchAndMergeOnchainBalances({
  cachedPortfolio,
  accountAddress,
  currencyIds,
  balanceOverrideSnapshots,
}: {
  cachedPortfolio: Portfolio
  accountAddress: string
  currencyIds: Set<CurrencyId>
  balanceOverrideSnapshots: BalanceOverrideSnapshots
}): Promise<FetchAndMergeOnchainBalancesResult | undefined> {
  const log = createLogger(FILE_NAME, 'fetchAndMergeOnchainBalances', '[ITBU]')
  log.debug(`Fetching onchain balances for ${currencyIds.size} currencies`, {
    accountAddress,
    currencyIds: Array.from(currencyIds),
  })

  try {
    const fetchedOnchainBalances = await fetchOnChainBalances({
      cachedPortfolio,
      accountAddress,
      currencyIds,
    })

    log.debug('On-chain balance fetching completed', { fetchedBalances: fetchedOnchainBalances.size })

    const appliedBalanceSnapshots = getBalanceOverridesToApply({
      currencyIds,
      fetchedOnchainBalances,
      balanceOverrideSnapshots,
    })

    if (appliedBalanceSnapshots.size === 0) {
      log.debug('No on-chain balances or prior snapshots available, returning undefined')
      return undefined
    }

    // Wrap the portfolio in a GetPortfolioResponse
    const portfolioResponse = new GetPortfolioResponse({
      portfolio: cachedPortfolio,
    })

    // mergeOnChainBalances drains its map via delete, so preserve these snapshots for cleanup.
    const mergedData = mergeOnChainBalances(portfolioResponse, new Map(appliedBalanceSnapshots))

    if (!mergedData) {
      return undefined
    }

    log.debug('Successfully merged onchain balances into portfolio data')

    return { mergedData, fetchedOnchainBalances, appliedBalanceSnapshots }
  } catch (error) {
    log.error(error, {
      accountAddress,
      currencyIds: Array.from(currencyIds),
      message: 'Error fetching and merging onchain balances',
    })
    return undefined
  }
}

export function* refetchQueriesViaOnchainOverrideVariant({
  transaction,
  activeAddress,
}: {
  transaction: TransactionDetails
  activeAddress: string | null
}): Generator {
  const currenciesWithBalanceToUpdate = getCurrenciesToUpdate(transaction, activeAddress)

  if (!activeAddress || !currenciesWithBalanceToUpdate) {
    return
  }

  const log = createLogger(FILE_NAME, 'refetchQueriesViaOnchainOverrideVariant', '[ITBU]')
  log.debug('Currencies to update detected', {
    currencyIds: Array.from(currenciesWithBalanceToUpdate),
    count: currenciesWithBalanceToUpdate.size,
  })

  // Save to Redux so that subsequent queries will apply overrides
  yield* put(
    addTokensToBalanceOverride({
      ownerAddress: activeAddress,
      currencyIds: Array.from(currenciesWithBalanceToUpdate),
    }),
  )

  const platform = chainIdToPlatform(transaction.chainId)

  // Find all active portfolio queries that match this address
  const portfolioQueriesToUpdate = getPortfolioQueriesToUpdate({ address: activeAddress, platform })

  log.debug(`Found ${portfolioQueriesToUpdate.length} matching portfolio queries`, {
    portfolioQueriesToUpdate,
    address: activeAddress,
    platform,
  })

  // Update the cache with fresh on-chain balances for each query in parallel
  yield* all(
    portfolioQueriesToUpdate.map((query) =>
      call(updatePortfolioCache, {
        ownerAddress: activeAddress,
        currencyIds: currenciesWithBalanceToUpdate,
        queryKey: query.queryKey,
      }),
    ),
  )

  // Wait before invalidating and refetching queries
  yield* delay(REFETCH_DELAY)

  // Invalidate all portfolio queries that match this address
  yield* call([SharedQueryClient, SharedQueryClient.invalidateQueries], {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      doesGetPortfolioQueryMatchAddress({ queryKey: query.queryKey, address: activeAddress, platform }),
  })

  // Invalidate aggregate wallet-balance queries for this address. The response is
  // aggregate-only (no per-balance entries), so a plain invalidate-and-refetch is sufficient.
  yield* call([SharedQueryClient, SharedQueryClient.invalidateQueries], {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      doesGetWalletBalancesQueryMatchAddress({ queryKey: query.queryKey, address: activeAddress, platform }),
  })

  // Invalidate token profit/loss queries for this address so the TDP Performance section updates after swaps
  yield* call([SharedQueryClient, SharedQueryClient.invalidateQueries], {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] === ReactQueryCacheKey.GetWalletTokenProfitLoss && query.queryKey[1] === activeAddress,
  })

  // Invalidate NFTs queries so the NFTs tab updates after swaps
  yield* call([SharedQueryClient, SharedQueryClient.invalidateQueries], {
    queryKey: NFT_QUERY_KEY_PREFIX,
  })
}

// oxlint-disable-next-line typescript/explicit-function-return-type
function* updatePortfolioCache({
  ownerAddress,
  currencyIds,
  queryKey,
}: {
  ownerAddress: string
  currencyIds: Set<CurrencyId>
  queryKey: readonly unknown[]
}) {
  const log = createLogger(FILE_NAME, 'updatePortfolioCache', '[ITBU]')
  log.debug(`updatePortfolioCache with ${currencyIds.size} currencyIds`, { currencyIds })

  const cachedPortfolioData = SharedQueryClient.getQueryData<GetPortfolioResponse>(queryKey)

  if (!cachedPortfolioData?.portfolio) {
    log.warn('No cached portfolio data found')
    return
  }

  const { snapshots: currentBalanceSnapshots, generations: currentOverrideGenerations } =
    getBalanceOverrideStateForAddress({ address: ownerAddress })
  const reconciliation = yield* call(fetchAndMergeOnchainBalances, {
    cachedPortfolio: cachedPortfolioData.portfolio,
    accountAddress: ownerAddress,
    currencyIds,
    balanceOverrideSnapshots: currentBalanceSnapshots,
  })

  if (reconciliation) {
    log.debug('Updating cached portfolio balances')
    SharedQueryClient.setQueryData(queryKey, () => reconciliation.mergedData)
    log.debug('Successfully updated react-query cache with fresh balances')

    yield* call(storeBalanceOverrideSnapshots, {
      ownerAddress,
      nextSnapshots: reconciliation.fetchedOnchainBalances,
      expectedGenerations: currentOverrideGenerations,
    })
  } else {
    log.debug('No balance updates to apply')
  }

  log.debug('Cache update completed', { ownerAddress, currencyIds: Array.from(currencyIds) })
}
