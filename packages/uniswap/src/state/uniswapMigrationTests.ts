/**
 * Test helpers for testing migrations run in sequence.
 *
 * Called by migrations.test.ts to verify migrations work correctly with realistic
 * data that has passed through all prior migrations in the chain.
 *
 * For unit tests of individual migrations, see uniswapMigrations.test.ts.
 */
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'

// Mobile: 89
// Extension: 25
// Web: 25
export function testRemoveTHBFromCurrency(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)

  if (prevSchema.userSettings.currentCurrency === 'THB') {
    expect(result.userSettings.currentCurrency).toEqual('USD')
  } else {
    expect(result.userSettings.currentCurrency).toEqual(prevSchema.userSettings.currentCurrency)
  }
}

// Mobile: 93
// Extension: 27
// Web: 55
export function testMigrateSearchHistory(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)

  if (prevSchema.searchHistory.results) {
    expect(result.searchHistory.results.length).toEqual(prevSchema.searchHistory.results.length)

    for (const item of result.searchHistory.results) {
      // Check that no result has type ENS or Unitag
      expect(item.type).not.toBe(PreV55SearchResultType.ENSAddress)
      expect(item.type).not.toBe(PreV55SearchResultType.Unitag)

      // Check that token types do not contain name or symbol
      if (item.type === SearchHistoryResultType.Token) {
        expect(item).not.toHaveProperty('name')
        expect(item).not.toHaveProperty('symbol')
      }
    }
  }
}

// Mobile: 95
// Extension: 29
// Web: 59
export function testAddActivityVisibility(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)
  expect(result.visibility.activity).toEqual({})
}

// Mobile: 96
// Extension: 30
// Web: 60
export function testMigrateDismissedTokenWarnings(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)

  // oxlint-disable-next-line guard-for-in -- biome-parity: oxlint is stricter here
  for (const chainId in result.tokens.dismissedTokenWarnings) {
    // oxlint-disable-next-line guard-for-in -- biome-parity: oxlint is stricter here
    for (const address in result.tokens.dismissedTokenWarnings[chainId]) {
      expect(result.tokens.dismissedTokenWarnings[chainId][address].warnings).toEqual([
        TokenProtectionWarning.NonDefault,
      ])
    }
  }
}

// Mobile: 98
// Extension: 32
// Web: 62
export function testAddEnableCustomGasFeeEntry(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)
  expect(result.userSettings.enableCustomGasFeeEntry).toBe(false)
}

// Mobile: 99
// Extension: 33
// Web: 63
export function testRemoveUniswapWrapped2025BehaviorHistory(migration: (state: any) => any, prevSchema: any): void {
  const result = migration({
    ...prevSchema,
    uniswapBehaviorHistory: {
      ...prevSchema?.uniswapBehaviorHistory,
      hasDismissedUniswapWrapped2025Banner: true,
    },
  })
  expect(result.uniswapBehaviorHistory).not.toHaveProperty('hasDismissedUniswapWrapped2025Banner')
}

// Mobile: 100
// Extension: 34
// Web: 64
export function testMarkPoolsBalanceCoachmarkEligible(migration: (state: any) => any, prevSchema: any): void {
  // Overwrites the old always-`true` default so existing installs become eligible.
  const result = migration({
    ...prevSchema,
    uniswapBehaviorHistory: {
      ...prevSchema?.uniswapBehaviorHistory,
      hasDismissedPoolsBalanceCoachmark: true,
    },
  })
  expect(result.uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark).toBe(false)
}

// Mobile: 104
// Extension: 37
// Web: 65
export function testRemoveBlastChainData(migration: (state: any) => any, prevSchema: any): void {
  const blastTx = { id: 'blast-tx', chainId: 81457 }
  const mainnetTx = { id: 'mainnet-tx', chainId: 1 }
  const result = migration({
    ...prevSchema,
    transactions: { '0xabc': { 1: { [mainnetTx.id]: mainnetTx }, 81457: { [blastTx.id]: blastTx } } },
    favorites: { ...prevSchema.favorites, tokens: ['1-0xa', '81457-0xb'] },
  })
  expect(result.transactions).toEqual({ '0xabc': { 1: { [mainnetTx.id]: mainnetTx } } })
  expect(result.favorites.tokens).toEqual(['1-0xa'])
}

// Mobile: 106
// Extension: 38
// Web: 66
export function testAddNewUserOnboardingHistory(migration: (state: any) => any, prevSchema: any): void {
  const swap = { id: 'swap', status: 'confirmed', typeInfo: { type: 'swap' } }
  const send = { id: 'send', status: 'confirmed', typeInfo: { type: 'send' } }
  const result = migration({
    ...prevSchema,
    transactions: { '0xABC': { 1: { [swap.id]: swap } }, '0xDEF': { 1: { [send.id]: send } } },
  })
  expect(result.uniswapBehaviorHistory.newUserOnboarding).toEqual({ byWallet: { '0xabc': { hasCompletedSwap: true } } })
}
