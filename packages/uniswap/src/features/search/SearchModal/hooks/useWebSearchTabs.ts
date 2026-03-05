import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { SearchTab, WEB_SEARCH_TABS, WEB_SEARCH_TABS_WITH_WALLETS } from 'uniswap/src/features/search/SearchModal/types'

export function useWebSearchTabs(): SearchTab[] {
  const walletSearchEnabled = useFeatureFlag(FeatureFlags.ViewExternalWalletsOnWeb)
  return walletSearchEnabled ? WEB_SEARCH_TABS_WITH_WALLETS : WEB_SEARCH_TABS
}
