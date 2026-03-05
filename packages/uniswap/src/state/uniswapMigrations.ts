/* eslint-disable @typescript-eslint/no-unsafe-return */
/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  SearchHistoryResultType,
  type WalletByAddressSearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import { searchResultId } from 'uniswap/src/features/search/searchHistorySlice'
import {
  type SerializedTokenMap,
  type TokenDismissInfo,
  type TokenWarningDismissal,
} from 'uniswap/src/features/tokens/warnings/slice/types'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { createSafeMigrationFactory } from 'uniswap/src/state/createSafeMigration'
import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'
import { getValidAddress } from 'uniswap/src/utils/addresses'

const createSafeMigration = createSafeMigrationFactory('uniswapMigrations')

// Mobile: 82
// Extension: 18
// Web: 21
export const unchecksumDismissedTokenWarningKeys = createSafeMigration({
  name: 'unchecksumDismissedTokenWarningKeys',
  migrate: (state: any) => {
    if (!state?.tokens?.dismissedTokenWarnings) {
      return state
    }

    const newDismissedWarnings: SerializedTokenMap<TokenDismissInfo> = Object.entries(
      state.tokens.dismissedTokenWarnings,
    ).reduce(
      (acc, [chainId, warningsForChain]) => ({
        ...acc,
        [chainId]:
          warningsForChain && typeof warningsForChain === 'object'
            ? Object.entries(warningsForChain as Record<string, TokenDismissInfo>).reduce(
                (chainAcc, [address, warning]) => {
                  const lowercasedAddress = getValidAddress({
                    address,
                    platform: Platform.EVM,
                    withEVMChecksum: false,
                  })
                  return lowercasedAddress ? { ...chainAcc, [lowercasedAddress]: warning } : chainAcc
                },
                {},
              )
            : {},
      }),
      {},
    )

    return {
      ...state,
      tokens: {
        ...state.tokens,
        dismissedTokenWarnings: newDismissedWarnings,
      },
    }
  },
  onError: (state: any) => ({
    ...state,
    tokens: {
      ...state.tokens,
      dismissedTokenWarnings: {},
    },
  }),
})

// Mobile: 89
// Extension: 25
// Web: 25
export function removeThaiBahtFromFiatCurrency(state: any): any {
  if (!state?.userSettings) {
    return state
  }

  if (state.userSettings.currentCurrency === 'THB') {
    return {
      ...state,
      userSettings: {
        ...state.userSettings,
        currentCurrency: FiatCurrency.UnitedStatesDollar,
      },
    }
  }

  return state
}

// Mobile: 93
// Extension: 27
// Web: 55

/**
 * Shared migration function to:
 * 1. Remove dynamic fields from TokenSearchHistoryResult
 * 2. Handle enum reordering - remove ENSAddress and Unitag, and update remaining values
 * Used by both mobile and extension platforms
 */
export const migrateSearchHistory = createSafeMigration({
  name: 'migrateSearchHistory',
  migrate: (state: any) => {
    if (!state?.searchHistory?.results || !Array.isArray(state.searchHistory.results)) {
      return state
    }

    // Map over search results, handle enum reordering, and remove deleted fields
    const migratedResults = state.searchHistory.results
      .map((result: any) => {
        // Map old enum values to new ones
        switch (result?.type) {
          case PreV55SearchResultType.ENSAddress:
          case PreV55SearchResultType.Unitag: {
            // ENSAddress and Unitag no longer exist, we convert them into WalletByAddress
            const walletByAddressResult: Omit<WalletByAddressSearchHistoryResult, 'searchId'> = {
              type: SearchHistoryResultType.WalletByAddress,
              address: result.address,
            }
            return {
              ...walletByAddressResult,
              searchId: searchResultId(walletByAddressResult),
            }
          }
          case PreV55SearchResultType.WalletByAddress:
            // WalletByAddress: 5 → 3
            return {
              type: SearchHistoryResultType.WalletByAddress,
              address: result.address,
              searchId: result.searchId,
            }
          case PreV55SearchResultType.Token:
            // Token: 1 → 0, also remove dynamic fields
            return {
              type: SearchHistoryResultType.Token,
              chainId: result.chainId,
              address: result.address,
              searchId: result.searchId,
            }

          case PreV55SearchResultType.Etherscan:
            // Etherscan: 2 → 1
            return {
              type: SearchHistoryResultType.Etherscan,
              address: result.address,
              searchId: result.searchId,
            }

          case PreV55SearchResultType.NFTCollection:
            // NFTCollection: 3 → 2
            return {
              type: SearchHistoryResultType.NFTCollection,
              chainId: result.chainId,
              address: result.address,
              name: result.name,
              imageUrl: result.imageUrl,
              isVerified: result.isVerified,
              searchId: result.searchId,
            }

          case PreV55SearchResultType.Pool:
            // Pool: 6 → 4
            return {
              type: SearchHistoryResultType.Pool,
              chainId: result.chainId,
              poolId: result.poolId,
              protocolVersion: result.protocolVersion,
              hookAddress: result.hookAddress,
              feeTier: result.feeTier,
              token0CurrencyId: result.token0CurrencyId,
              token1CurrencyId: result.token1CurrencyId,
              searchId: result.searchId,
            }

          default:
            // Unknown type, filter it out
            return null
        }
      })
      .filter((result: any) => result !== null)

    return {
      ...state,
      searchHistory: {
        ...state.searchHistory,
        results: migratedResults,
      },
    }
  },
  onError: (state: any) => ({
    ...state,
    searchHistory: { results: [] },
  }),
})

// Mobile: 94
// Extension: 28
// Web: 57
// Ensure new token warning maps exist in persisted state after introducing them
export function addDismissedBridgedAndCompatibleWarnings(state: any): any {
  if (!state?.tokens) {
    return state
  }
  return {
    ...state,
    tokens: {
      ...state.tokens,
      dismissedBridgedAssetWarnings: state.tokens.dismissedBridgedAssetWarnings ?? {},
      dismissedCompatibleAddressWarnings: state.tokens.dismissedCompatibleAddressWarnings ?? {},
    },
  }
}

// Mobile: 95
// Extension: 29
// Web: 59
export function addActivityVisibility(state: any): any {
  if (!state?.visibility) {
    return state
  }
  return {
    ...state,
    visibility: { ...state.visibility, activity: {} },
  }
}

// Mobile: 96
// Extension: 30
// Web: 60
export const migrateDismissedTokenWarnings = createSafeMigration({
  name: 'migrateDismissedTokenWarnings',
  migrate: (state: any) => {
    if (!state?.tokens?.dismissedTokenWarnings) {
      return state
    }

    const newDismissedWarnings: SerializedTokenMap<TokenWarningDismissal> = Object.entries(
      state.tokens.dismissedTokenWarnings,
    ).reduce(
      (acc, [chainId, warningsForChain]) => ({
        ...acc,
        [chainId]:
          warningsForChain && typeof warningsForChain === 'object'
            ? Object.entries(warningsForChain as Record<string, TokenDismissInfo>).reduce(
                (chainAcc, [address, token]) => {
                  return { ...chainAcc, [address]: { token, warnings: [TokenProtectionWarning.NonDefault] } }
                },
                {},
              )
            : {},
      }),
      {},
    )

    return {
      ...state,
      tokens: { ...state.tokens, dismissedTokenWarnings: newDismissedWarnings },
    }
  },
  onError: (state: any) => ({
    ...state,
    tokens: { ...state.tokens, dismissedTokenWarnings: {} },
  }),
})
