import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/utils'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { TokenSafetyAnalyticsProperties } from 'uniswap/src/features/telemetry/types'
import { CurrencyField } from 'uniswap/src/types/currency'

/**
 * The single `Token Selected` emit for the token selector. The vertical rows and the Stocks shelf both route
 * through here so the two payloads can't drift — `category`/`tokenSection` is what splits the surfaces apart
 * downstream, so a section that emits a different shape is invisible rather than wrong.
 */
export function sendTokenSelectedAnalytics({
  name,
  address,
  chainId,
  flow,
  page,
  currencyField,
  sectionKey,
  position,
  suggestionCount,
  query,
  tokenBalanceUsd,
  tokenCategory,
  safety,
}: {
  name?: string
  address: string
  chainId: number
  flow: TokenSelectorFlow
  page?: string
  currencyField: CurrencyField
  sectionKey: OnchainItemSectionName
  /** 1-based position within the section. */
  position?: number
  suggestionCount?: number
  query?: string
  tokenBalanceUsd?: number
  tokenCategory: string | null
  safety?: TokenSafetyAnalyticsProperties
}): void {
  sendAnalyticsEvent(UniswapEventName.TokenSelected, {
    name,
    address,
    chain: chainId,
    modal: flowToModalName(flow),
    page,
    field: currencyField,
    token_balance_usd: tokenBalanceUsd,
    category: sectionKey,
    position,
    suggestion_count: suggestionCount,
    query,
    tokenSection: sectionKey,
    preselect_asset: false,
    token_category: tokenCategory,
    blockaid_status: safety?.blockaid_status,
    is_suppressed: safety?.is_suppressed,
  })
}
