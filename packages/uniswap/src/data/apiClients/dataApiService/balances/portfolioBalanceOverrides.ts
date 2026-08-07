import { type PartialMessage } from '@bufbuild/protobuf'
import { ToolkitStore } from '@reduxjs/toolkit/dist/configureStore'
import { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type Balance } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { AccountAddressesByPlatform } from 'uniswap/src/data/apiClients/dataApiService/utils/buildAccountAddressesByPlatform'
import { type OnChainMap } from 'uniswap/src/features/portfolio/portfolioUpdates/fetchOnChainBalances'
import { makeSelectTokenBalanceOverridesForWalletAddress } from 'uniswap/src/features/portfolio/slice/selectors'
import {
  removeTokenFromBalanceOverride,
  type ExpectedTokenBalanceOverrideGeneration,
  type TokenBalanceOverride,
} from 'uniswap/src/features/portfolio/slice/slice'
import { CurrencyId } from 'uniswap/src/types/currency'
import { normalizeCurrencyIdForMapLookup, normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import {
  buildCurrencyId,
  currencyIdToAddress,
  currencyIdToChain,
  isNativeCurrencyAddress,
} from 'uniswap/src/utils/currencyId'
import { createLogger } from 'utilities/src/logger/logger'

const FILE_NAME = 'portfolioBalanceOverrides.ts'

export type BalanceOverrideSnapshots = OnChainMap
export type BalanceOverrideGenerations = Map<CurrencyId, ExpectedTokenBalanceOverrideGeneration>

export type BalanceOverrideState = {
  snapshots: BalanceOverrideSnapshots
  generations: BalanceOverrideGenerations
}

type BalanceOverrideSnapshotEntry = {
  balance: PartialMessage<Balance>
  generation: ExpectedTokenBalanceOverrideGeneration
}

// The backend seems to be truncating some decimals for certain tokens,
// so instead of checking for exact equality, we check if the quantities are "aproximately" equal.
const APPROXIMATE_EQUALITY_THRESHOLD_PERCENT = 0.02 // 2%

// Module-level references to Redux store
// These are initialized once during app startup
let portfolioQueryReduxStore: ToolkitStore | null = null
const balanceOverrideSnapshotsByAddress = new Map<string, Map<CurrencyId, BalanceOverrideSnapshotEntry>>()

function pruneBalanceOverrideSnapshots({
  normalizedAddress,
  overrides,
}: {
  normalizedAddress: string
  overrides: TokenBalanceOverride | undefined
}): void {
  const cachedSnapshots = balanceOverrideSnapshotsByAddress.get(normalizedAddress)

  if (!cachedSnapshots) {
    return
  }

  if (!overrides) {
    balanceOverrideSnapshotsByAddress.delete(normalizedAddress)
    return
  }

  cachedSnapshots.forEach((snapshot, currencyId) => {
    const override = overrides[currencyId]

    if (!override || (override.generation ?? null) !== snapshot.generation) {
      cachedSnapshots.delete(currencyId)
    }
  })

  if (cachedSnapshots.size === 0) {
    balanceOverrideSnapshotsByAddress.delete(normalizedAddress)
  }
}

function getOverridesAndPruneSnapshots({ address }: { address: string }): {
  normalizedAddress: string
  overrides: TokenBalanceOverride | undefined
} {
  const normalizedAddress = normalizeTokenAddressForCache(address)
  const overrides = portfolioQueryReduxStore
    ? selectTokenBalanceOverridesForWalletAddress(portfolioQueryReduxStore.getState(), normalizedAddress)
    : undefined

  pruneBalanceOverrideSnapshots({ normalizedAddress, overrides })

  return { normalizedAddress, overrides }
}

function removeBalanceOverrideSnapshot({
  ownerAddress,
  currencyId,
  expectedGeneration,
}: {
  ownerAddress: string
  currencyId: CurrencyId
  expectedGeneration: ExpectedTokenBalanceOverrideGeneration
}): void {
  const normalizedAddress = normalizeTokenAddressForCache(ownerAddress)
  const snapshots = balanceOverrideSnapshotsByAddress.get(normalizedAddress)
  const snapshot = snapshots?.get(currencyId)

  if (snapshot?.generation !== expectedGeneration) {
    return
  }

  snapshots?.delete(currencyId)

  if (snapshots?.size === 0) {
    balanceOverrideSnapshotsByAddress.delete(normalizedAddress)
  }
}

/**
 * Initializes the portfolio balance override mechanism.
 * This must be called once during each app initialization after the Redux store is created.
 */
export function initializePortfolioQueryOverrides({ store }: { store: ToolkitStore }): void {
  const log = createLogger(FILE_NAME, 'initializePortfolioQueryOverrides', '[REST-ITBU]')

  if (portfolioQueryReduxStore) {
    log.warn('`initializePortfolioQueryOverrides` called multiple times')
  }

  if (portfolioQueryReduxStore !== store) {
    balanceOverrideSnapshotsByAddress.clear()
  }

  portfolioQueryReduxStore = store

  log.debug('Portfolio query overrides successfully initialized')
}

export function getPortfolioQueryReduxStore(): ToolkitStore | null {
  return portfolioQueryReduxStore
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

  const { overrides } = getOverridesAndPruneSnapshots({ address })

  if (!overrides) {
    return new Set()
  }

  return new Set(Object.keys(overrides))
}

/**
 * Get the confirmed snapshots and generation guards for all active overrides.
 * Snapshots are process-local derived cache; only override IDs and generations are persisted in Redux.
 * A missing persisted generation is normalized to null so it remains distinct from a newer generated override.
 */
export function getBalanceOverrideStateForAddress({ address }: { address: string }): BalanceOverrideState {
  if (!portfolioQueryReduxStore) {
    return { snapshots: new Map(), generations: new Map() }
  }

  const { normalizedAddress, overrides } = getOverridesAndPruneSnapshots({ address })

  if (!overrides) {
    return { snapshots: new Map(), generations: new Map() }
  }

  return {
    snapshots: new Map(
      Array.from(balanceOverrideSnapshotsByAddress.get(normalizedAddress) ?? []).map(([currencyId, snapshot]) => [
        currencyId,
        snapshot.balance,
      ]),
    ),
    generations: new Map(
      Object.entries(overrides).map(([currencyId, override]) => [currencyId, override.generation ?? null]),
    ),
  }
}

/**
 * Stores freshly confirmed on-chain balances for active overrides.
 * The current Redux generation is re-read after the async fetch so stale completions cannot overwrite newer snapshots.
 */
export function storeBalanceOverrideSnapshots({
  ownerAddress,
  nextSnapshots,
  expectedGenerations,
}: {
  ownerAddress: Address
  nextSnapshots: BalanceOverrideSnapshots
  expectedGenerations: BalanceOverrideGenerations
}): void {
  if (!portfolioQueryReduxStore || nextSnapshots.size === 0) {
    return
  }

  const { normalizedAddress, overrides } = getOverridesAndPruneSnapshots({ address: ownerAddress })

  if (!overrides) {
    return
  }

  let cachedSnapshots = balanceOverrideSnapshotsByAddress.get(normalizedAddress)

  nextSnapshots.forEach((balance, currencyId) => {
    const expectedGeneration = expectedGenerations.get(currencyId)
    const currentOverride = overrides[currencyId]

    if (
      !currentOverride ||
      expectedGeneration === undefined ||
      (currentOverride.generation ?? null) !== expectedGeneration
    ) {
      return
    }

    cachedSnapshots ??= new Map()
    cachedSnapshots.set(currencyId, {
      balance,
      generation: expectedGeneration,
    })
  })

  if (cachedSnapshots?.size) {
    balanceOverrideSnapshotsByAddress.set(normalizedAddress, cachedSnapshots)
  }
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
  balanceSnapshots,
  expectedGenerations,
}: {
  ownerAddress: string
  originalData: GetPortfolioResponse | undefined
  balanceSnapshots: BalanceOverrideSnapshots
  expectedGenerations: BalanceOverrideGenerations
}): void {
  const reduxStore = portfolioQueryReduxStore

  if (!reduxStore || !originalData?.portfolio?.balances) {
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
    if (!balance.token?.chainId || !balance.token.address || typeof balance.amount?.amount !== 'number') {
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

  overrideCurrencyIds.forEach((overrideCurrencyId) => {
    const onchainQuantity = balanceSnapshots.get(overrideCurrencyId)?.amount?.amount

    if (typeof onchainQuantity !== 'number') {
      log.debug(`No on-chain evidence for ${overrideCurrencyId}, keeping override`)
      return
    }

    const backendQuantity = originalBalancesMap.get(overrideCurrencyId)
    // Clear confirmed zeroes once the backend is zero/absent; otherwise wait until it matches the on-chain balance.
    const backendCaughtUp =
      onchainQuantity <= 0
        ? backendQuantity === undefined ||
          areBalancesApproximatelyEqual({ onchainQuantity: 0, cachedQuantity: backendQuantity })
        : areBalancesApproximatelyEqual({ onchainQuantity, cachedQuantity: backendQuantity })

    if (backendCaughtUp) {
      const chainId = currencyIdToChain(overrideCurrencyId)
      const tokenAddress = currencyIdToAddress(overrideCurrencyId)
      const expectedGeneration = expectedGenerations.get(overrideCurrencyId)

      if (chainId && tokenAddress && expectedGeneration !== undefined) {
        log.debug(`Backend has caught up for ${overrideCurrencyId}, removing override`, {
          onchainQuantity,
          backendQuantity,
        })

        reduxStore.dispatch(
          removeTokenFromBalanceOverride({
            ownerAddress,
            chainId,
            tokenAddress,
            expectedGeneration,
          }),
        )
        removeBalanceOverrideSnapshot({
          ownerAddress,
          currencyId: overrideCurrencyId,
          expectedGeneration,
        })
      }
    } else {
      log.debug(`Backend has not caught up for ${overrideCurrencyId}, keeping override`, {
        onchainQuantity,
        backendQuantity,
      })
    }
  })
}
