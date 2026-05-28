/* eslint-disable import/no-unused-modules */

import type {
  LendingMarketBrowseEntity,
  LendingMarketDetailEntity,
  LendingVaultBrowseEntity,
  LendingVaultDetailEntity,
} from 'pages/Markets/types'

export function useMorphoMarketsApiBrowse(): { items: LendingMarketBrowseEntity[] } {
  return { items: [] }
}

export function useMorphoVaultsApiBrowse(): { items: LendingVaultBrowseEntity[] } {
  return { items: [] }
}

export function useMorphoMarketApiDetail(
  _entityId?: string,
  _chainName?: string,
): { item?: LendingMarketDetailEntity; isLoading: boolean } {
  return { item: undefined, isLoading: false }
}

export function useMorphoVaultApiDetail(
  _entityId?: string,
  _chainName?: string,
): { item?: LendingVaultDetailEntity; isLoading: boolean } {
  return { item: undefined, isLoading: false }
}
