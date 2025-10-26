import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { AccountAddressesByPlatform } from 'uniswap/src/data/rest/buildAccountAddressesByPlatform'
import { makeSelectTokenBalanceOverridesForWalletAddress } from 'uniswap/src/features/portfolio/slice/selectors'
import { removeTokenFromBalanceOverride } from 'uniswap/src/features/portfolio/slice/slice'
import { CurrencyId } from 'uniswap/src/types/currency'
import { buildCurrencyId, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'

const FILE_NAME = 'portfolioBalanceOverrides.ts'

// The backend seems to be truncating some decimals for certain tokens,
// so instead of checking for exact equality, we check if the quantities are "aproximately" equal.
const APPROXIMATE_EQUALITY_THRESHOLD_PERCENT = 0.02 // 2%

// Module-level references to Redux store and Apollo client
// These are initialized once during app startup
let portfolioQueryReduxStore: ToolkitStore | null = null
let portfolioQueryApolloClient: ApolloClient<NormalizedCacheObject> | null = null

/**
 * Initializes the portfolio balance override mechanism.
 * This must be called once during each app initialization after both the Redux store and Apollo client are created.
 */
export function initializePortfolioQueryOverrides({
  store,
  apolloClient,
}: {
  store: ToolkitStore
  apolloClient: ApolloClient<NormalizedCacheObject>
}): void {
  const log = createLogger(FILE_NAME, 'initializePortfolioQueryOverrides', '[REST-ITBU]')

  if (portfolioQueryReduxStore || portfolioQueryApolloClient) {
    log.warn('`initializePortfolioQueryOverrides` called multiple times')
  }

  portfolioQueryReduxStore = store
  portfolioQueryApolloClient = apolloClient

  log.debug('Portfolio query overrides successfully initialized')
}

export function getPortfolioQueryReduxStore(): ToolkitStore | null {
  return portfolioQueryReduxStore
}

export function getPortfolioQueryApolloClient(): ApolloClient<NormalizedCacheObject> | null {
  return portfolioQueryApolloClient
}

const selectTokenBalanceOverridesForWalletAddress = makeSelectTokenBalanceOverridesForWalletAddress()

/**
 * Get balance overrides for a specific address from Redux.
 * @returns Set of currency IDs that have pending overrides, or empty set if none
 */
export function getOverridesForAddress({ address }: { address: string }): Set<CurrencyId> {
  if (!portfolioQueryReduxStore) {
    return new Set()
  }

  const normalizedAddress = normalizeTokenAddressForCache(address)
  const overrides = selectTokenBalanceOverridesForWalletAddress(portfolioQueryReduxStore.getState(), normalizedAddress)

  if (!overrides) {
    return new Set()
  }

  return new Set(Object.keys(overrides))
}

/**
 * Get all currency IDs with overrides for the addresses in a query.
 * @returns Set of currency IDs that need overriding for this query
 */
export function getOverridesForQuery({
  accountAddressesByPlatform,
}: {
  accountAddressesByPlatform: AccountAddressesByPlatform
}): Set<CurrencyId> {
  const allOverrides = new Set<CurrencyId>()

  Object.values(accountAddressesByPlatform).forEach((address) => {
    const overrides = getOverridesForAddress({ address })
    overrides.forEach((currencyId) => allOverrides.add(currencyId))
  })

  return allOverrides
}

/**
 * Check if two balance quantities are approximately equal (within 2% threshold).
 * This is used to determine if the backend has caught up with the onchain balance.
 * @returns true if the quantities are within 2% of each other
 */
export function areBalancesApproximatelyEqual({
  onchainQuantity,
  cachedQuantity,
}: {
  onchainQuantity: number
  cachedQuantity: number | undefined
}): boolean {
  if (typeof cachedQuantity !== 'number') {
    return false
  }

  if (cachedQuantity === 0) {
    return onchainQuantity === 0
  }

  const difference = Math.abs(onchainQuantity - cachedQuantity)
  const percentDifference = difference / Math.abs(cachedQuantity)

  return percentDifference <= APPROXIMATE_EQUALITY_THRESHOLD_PERCENT
}

/**
 * Clean up overrides from Redux when the backend has caught up.
 * Compares the onchain data with the cached data and removes overrides that are no longer needed.
 */
export function cleanupCaughtUpOverrides({
  ownerAddress,
  originalData,
  mergedData,
}: {
  ownerAddress: string
  originalData: GetPortfolioResponse | undefined
  mergedData: GetPortfolioResponse | undefined
}): void {
  const reduxStore = portfolioQueryReduxStore

  if (!reduxStore || !originalData?.portfolio?.balances || !mergedData?.portfolio?.balances) {
    return
  }

  const log = createLogger(FILE_NAME, 'cleanupCaughtUpOverrides', '[REST-ITBU]')

  const overrideCurrencyIds = getOverridesForAddress({ address: ownerAddress })

  log.debug('Checking if clean up is needed for caught up balances', {
    overrideCurrencyIds: Array.from(overrideCurrencyIds),
  })

  if (overrideCurrencyIds.size === 0) {
    return
  }

  // Build a map of currency ID to original backend balance (only for overridden currencies)
  const originalBalancesMap = new Map<CurrencyId, number>()
  originalData.portfolio.balances.forEach((balance) => {
    if (!balance.token?.chainId || !balance.token.address || !balance.amount?.amount) {
      return
    }

    const chainId = balance.token.chainId
    const tokenAddress = balance.token.address
    const address = isNativeCurrencyAddress(chainId, tokenAddress) ? getNativeAddress(chainId) : tokenAddress
    const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, address))

    // Only store balances that have active overrides
    if (overrideCurrencyIds.has(currencyId)) {
      originalBalancesMap.set(currencyId, balance.amount.amount)
    }
  })

  // Check each merged balance that has an override to see if backend has caught up
  mergedData.portfolio.balances.forEach((balance) => {
    if (!balance.token?.chainId || !balance.token.address || !balance.amount?.amount) {
      return
    }

    const chainId = balance.token.chainId
    const tokenAddress = balance.token.address
    const address = isNativeCurrencyAddress(chainId, tokenAddress) ? getNativeAddress(chainId) : tokenAddress
    const currencyId = normalizeCurrencyIdForMapLookup(buildCurrencyId(chainId, address))

    if (!overrideCurrencyIds.has(currencyId)) {
      return
    }

    const onchainQuantity = balance.amount.amount
    const backendQuantity = originalBalancesMap.get(currencyId)

    if (areBalancesApproximatelyEqual({ onchainQuantity, cachedQuantity: backendQuantity })) {
      log.debug(`Backend has caught up for ${currencyId}, removing override`, {
        onchainQuantity,
        backendQuantity,
      })

      reduxStore.dispatch(
        removeTokenFromBalanceOverride({
          ownerAddress,
          chainId,
          tokenAddress: address,
        }),
      )
    } else {
      log.debug(`Backend has not caught up for ${currencyId}, keeping override`, {
        onchainQuantity,
        backendQuantity,
      })
    }
  })
}
