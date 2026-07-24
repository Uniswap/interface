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
