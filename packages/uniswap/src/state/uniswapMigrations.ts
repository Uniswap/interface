/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  SearchHistoryResultType,
  WalletByAddressSearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import { searchResultId } from 'uniswap/src/features/search/searchHistorySlice'
import { SerializedTokenMap } from 'uniswap/src/features/tokens/slice/types'
import { PreV55SearchResultType } from 'uniswap/src/state/oldTypes'
import { getValidAddress } from 'uniswap/src/utils/addresses'

// Mobile: 82
// Extension: 18
// Web: 21
export function unchecksumDismissedTokenWarningKeys(state: any): any {
  if (!state?.tokens?.dismissedTokenWarnings) {
    return state
  }

  const newDismissedWarnings: SerializedTokenMap = Object.entries(state.tokens.dismissedTokenWarnings).reduce(
    (acc, [chainId, warningsForChain]) => ({
      ...acc,
      [chainId]: Object.entries(warningsForChain as Record<string, unknown>).reduce((chainAcc, [address, warning]) => {
        const lowercasedAddress = getValidAddress({
          address,
          platform: Platform.EVM,
          withEVMChecksum: false,
        })
        return lowercasedAddress ? { ...chainAcc, [lowercasedAddress]: warning } : chainAcc
      }, {}),
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
}

// Mobile: 89
// Extension: 25
// Web: 25
export function removeThaiBahtFromFiatCurrency(state: any): any {
  const newState = { ...state }
  if (newState.userSettings.currentCurrency === 'THB') {
    newState.userSettings.currentCurrency = FiatCurrency.UnitedStatesDollar
  }
  return newState
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
export function migrateSearchHistory(state: any): any {
  const newState = { ...state }

  if (newState.searchHistory?.results) {
    // Map over search results, handle enum reordering, and remove deleted fields
    const migratedResults = newState.searchHistory.results
      .map((result: any) => {
        // Map old enum values to new ones
        switch (result.type) {
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

    newState.searchHistory.results = migratedResults
  }

  return newState
}

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
