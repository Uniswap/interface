import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useCallback } from 'react'
import { RwaTokenOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { sendTokenSelectedAnalytics } from 'uniswap/src/components/TokenSelector/analytics/sendTokenSelectedAnalytics'
import { OnSelectRwaToken, TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { getRowTagCategoryId } from 'uniswap/src/data/apiClients/dataApiService/categories/getRowTagCategoryId'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getCurrencyInfoSafetyAnalytics } from 'uniswap/src/features/telemetry/tokenSafetyAnalytics'
import { isChainSupportedForChainedActions } from 'uniswap/src/features/transactions/swap/utils/chainedActions'
import { CurrencyField } from 'uniswap/src/types/currency'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

export function useTokenSelectionHandler({
  flow,
  currencyField,
  chainFilter,
  oppositeToken,
  debouncedSearchFilter,
  onSelectCurrency,
  onSelectRwaToken,
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
  onSelectRwaToken?: OnSelectRwaToken
}): {
  currencyFieldName: ElementName | undefined
  // oxlint-disable-next-line max-params
  onSelectCurrencyCallback: (
    currencyInfo: CurrencyInfo,
    section: OnchainItemSection<TokenSelectorOption>,
    index: number,
  ) => void
  /** Undefined when the caller wires no RWA handler, so the Stocks shelf can't log a selection that never happens. */
  onSelectRwaTokenCallback: OnSelectRwaToken | undefined
} {
  const { page } = useTrace()
  const { categories } = useAllTokenCategories()

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
      sendTokenSelectedAnalytics({
        name: currencyInfo.currency.name,
        address: currencyAddress(currencyInfo.currency),
        chainId: currencyInfo.currency.chainId,
        flow,
        page,
        currencyField,
        sectionKey: section.sectionKey,
        position: searchContext.position,
        suggestionCount: searchContext.suggestionCount,
        query: searchContext.query,
        tokenBalanceUsd: balanceUSD,
        tokenCategory: getRowTagCategoryId({
          currencyId: currencyInfo.currencyId,
          categoryIds: currencyInfo.categoryIds,
          categories,
        }),
        safety: getCurrencyInfoSafetyAnalytics(currencyInfo),
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
    [
      debouncedSearchFilter,
      chainFilter,
      flow,
      page,
      currencyField,
      onSelectCurrency,
      oppositeToken?.chainId,
      categories,
    ],
  )

  const onSelectRwaTokenCallback = useEvent(
    (option: RwaTokenOption, context: Parameters<OnSelectRwaToken>[1]): void => {
      if (!onSelectRwaToken) {
        return
      }
      sendTokenSelectedAnalytics({
        name: option.name,
        address: option.address,
        chainId: option.chainId,
        flow,
        page,
        currencyField,
        sectionKey: context.sectionKey,
        position: context.position,
        suggestionCount: context.suggestionCount,
        tokenCategory: getRowTagCategoryId({ currencyId: buildCurrencyId(option.chainId, option.address), categories }),
      })
      onSelectRwaToken(option, context)
    },
  )

  return {
    currencyFieldName,
    onSelectCurrencyCallback,
    onSelectRwaTokenCallback: onSelectRwaToken ? onSelectRwaTokenCallback : undefined,
  }
}
