import { Currency } from '@uniswap/sdk-core'
import { useCallback } from 'react'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/utils'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { ElementName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { isChainSupportedForChainedActions } from 'uniswap/src/features/transactions/swap/utils/chainedActions'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function useTokenSelectionHandler({
  flow,
  currencyField,
  chainFilter,
  oppositeToken,
  debouncedSearchFilter,
  onSelectCurrency,
}: {
  flow: TokenSelectorFlow
  currencyField: CurrencyField
  chainFilter: UniverseChainId | null
  oppositeToken: TradeableAsset | undefined
  debouncedSearchFilter: string | null
  onSelectCurrency: (args: {
    currency: Currency
    field: CurrencyField
    allowCrossChainPair: boolean
    isPreselectedAsset: boolean
  }) => void
}): {
  currencyFieldName: ElementName | undefined
  // oxlint-disable-next-line max-params
  onSelectCurrencyCallback: (
    currencyInfo: CurrencyInfo,
    section: OnchainItemSection<TokenSelectorOption>,
    index: number,
  ) => void
} {
  const { page } = useTrace()

  // Log currency field only for swap as for send it's always input
  const currencyFieldName =
    flow === TokenSelectorFlow.Swap
      ? currencyField === CurrencyField.INPUT
        ? ElementName.TokenInputSelector
        : ElementName.TokenOutputSelector
      : undefined

  const onSelectCurrencyCallback = useCallback(
    // oxlint-disable-next-line max-params
    (currencyInfo: CurrencyInfo, section: OnchainItemSection<TokenSelectorOption>, index: number): void => {
      const searchContext: SearchContext = {
        category: section.sectionKey,
        query: debouncedSearchFilter ?? undefined,
        position: index + 1,
        suggestionCount: section.data.length,
        searchChainFilter: chainFilter,
      }

      // log event that a currency was selected
      const tokenOption = section.data[index]
      const balanceUSD = Array.isArray(tokenOption) ? undefined : (tokenOption?.balanceUSD ?? undefined)
      sendAnalyticsEvent(UniswapEventName.TokenSelected, {
        name: currencyInfo.currency.name,
        address: currencyAddress(currencyInfo.currency),
        chain: currencyInfo.currency.chainId,
        modal: flowToModalName(flow),
        page,
        field: currencyField,
        token_balance_usd: balanceUSD,
        category: searchContext.category,
        position: searchContext.position,
        suggestion_count: searchContext.suggestionCount,
        query: searchContext.query,
        tokenSection: section.sectionKey,
        preselect_asset: false,
      })

      const oppositeChainId = oppositeToken?.chainId

      const isUnsupportedCombo =
        (oppositeChainId && !isChainSupportedForChainedActions(oppositeChainId)) ||
        !isChainSupportedForChainedActions(currencyInfo.currency.chainId)

      const allowCrossChainPair = !isUnsupportedCombo || section.sectionKey === OnchainItemSectionName.BridgingTokens

      onSelectCurrency({
        currency: currencyInfo.currency,
        field: currencyField,
        allowCrossChainPair,
        isPreselectedAsset: false,
      })
    },
    [debouncedSearchFilter, chainFilter, flow, page, currencyField, onSelectCurrency, oppositeToken?.chainId],
  )

  return { currencyFieldName, onSelectCurrencyCallback }
}
