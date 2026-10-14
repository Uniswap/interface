import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { memo, useCallback, useMemo, useState } from 'react'
import { TokenOption, TokenSelectorListOption } from 'uniswap/src/components/lists/items/types'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { StocksShelfRow } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksShelfRow'
import { tagRwaTokenSelectorSections } from 'uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections'
import { useTokenSelectorHoverConfig } from 'uniswap/src/components/TokenSelector/TokenSelectorHoverConfig'
import { isStocksRowItem, key } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { OnSelectCurrency, OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import {
  OnSelectTokenOption,
  usePendingWarningSelection,
} from 'uniswap/src/components/TokenSelectorV2/hooks/usePendingWarningSelection'
import { RecentSearchPillRow } from 'uniswap/src/components/TokenSelectorV2/items/RecentSearchPillRow'
import { SuggestedTokenTileRow } from 'uniswap/src/components/TokenSelectorV2/items/SuggestedTokenTileRow'
import { TokenSelectorV2Row } from 'uniswap/src/components/TokenSelectorV2/items/TokenSelectorV2Row'
import { TokenSelectorV2SkeletonOverlay } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2Skeleton'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import { useRwaIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIndex'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useEvent } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'

/** Builds the row's onPress from stable props so TokenSelectorV2Row's memo holds across list re-renders
 *  (e.g. stock-row expansion) — mirrors the legacy TokenOptionItem wrapper. */
const TokenSelectorV2RowItem = memo(function TokenSelectorV2RowItem({
  option,
  section,
  index,
  showTokenWarnings,
  showTokenAddress,
  categories,
  onSelectToken,
}: {
  option: TokenOption
  section: OnchainItemSection<TokenOption>
  index: number
  showTokenWarnings: boolean
  showTokenAddress?: boolean
  categories: TokenCategory[]
  onSelectToken: OnSelectTokenOption
}): JSX.Element {
  const onPress = useCallback(() => onSelectToken(option, section, index), [onSelectToken, option, section, index])

  // Blocked rows stay pressable (dimmed only) so the press opens TokenWarningModal's blocked explanation.
  const isBlocked = showTokenWarnings && getTokenWarningSeverity(option.currencyInfo) === WarningSeverity.Blocked

  return (
    <TokenSelectorV2Row
      dimmed={isBlocked || Boolean(option.isUnsupported)}
      categories={categories}
      disabled={Boolean(option.isUnsupported)}
      option={option}
      showTokenAddress={showTokenAddress}
      onPress={onPress}
    />
  )
})

interface TokenSelectorV2ListProps {
  onSelectCurrency: OnSelectCurrency
  onSelectRwaToken?: OnSelectRwaToken
  sections?: OnchainItemSection<TokenSelectorListOption>[]
  chainFilter?: UniverseChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
  renderedInModal: boolean
  suggestedTilesMaxCount: number
}

/**
 * V2 list renderer. Differences from the legacy TokenSelectorList by design (M1 target architecture):
 * - Warning + bridged-asset modals are hoisted to list level via usePendingWarningSelection.
 * - Horizontal renderers are dispatched by `sectionKey`, not array shape (SWAP-3042/3043).
 * Context menus are intentionally absent from V2 rows pending the shared hoisted-menu pattern (SWAP-3025).
 */
export const TokenSelectorV2List = memo(function TokenSelectorV2List({
  onSelectCurrency,
  onSelectRwaToken,
  sections,
  chainFilter,
  showTokenWarnings,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
  renderedInModal,
  suggestedTilesMaxCount,
}: TokenSelectorV2ListProps): JSX.Element {
  usePerformanceLogger(DDRumManualTiming.TokenSelectorListRender, [chainFilter])

  const wrapTokenRow = useTokenSelectorHoverConfig()

  const { handleTokenPress, pendingModal } = usePendingWarningSelection({ showTokenWarnings, onSelectCurrency })

  const rwaIndex = useRwaIndex()
  const plainTokenNames = useIsTokenCategoriesEnabled()
  const taggedSections = useMemo(
    () => tagRwaTokenSelectorSections({ sections, rwaIndex, plainTokenNames }),
    [sections, rwaIndex, plainTokenNames],
  )
  const { categories } = useAllTokenCategories()

  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleExpand = useEvent((item: TokenSelectorListOption) => {
    setExpandedItems((prev) => [...prev, key(item)])
  })

  const isExpandedItem = useEvent((item: TokenSelectorListOption) => {
    return expandedItems.includes(key(item))
  })

  // `useCallback`, not `useEvent`: rows re-render only when this identity changes, so list-level data they
  // read (`categories`) has to be in the deps or rows keep the first-render value.
  const renderItem = useCallback(
    ({ item, section, index }: ItemRowInfo<TokenSelectorListOption>) => {
      if (isStocksRowItem(item)) {
        return (
          <StocksShelfRow
            expanded={isExpandedItem(item)}
            showTokenWarnings={showTokenWarnings}
            tokens={item}
            onExpand={handleExpand}
            onSelectRwaToken={onSelectRwaToken ?? noop}
          />
        )
      }

      if (Array.isArray(item)) {
        // Horizontal renderers dispatch on sectionKey (not array shape) — the shared mechanism of SWAP-3042/3043.
        const tokenSection = section as OnchainItemSection<TokenOption[]>
        switch (section.sectionKey) {
          case OnchainItemSectionName.RecentSearches:
            return (
              <RecentSearchPillRow
                section={tokenSection}
                showTokenWarnings={showTokenWarnings}
                tokens={item}
                onSelectToken={handleTokenPress}
              />
            )
          case OnchainItemSectionName.SuggestedTokens:
          default:
            return (
              <SuggestedTokenTileRow
                maxCount={suggestedTilesMaxCount}
                section={tokenSection}
                showTokenWarnings={showTokenWarnings}
                tokens={item}
                onSelectToken={handleTokenPress}
              />
            )
        }
      }

      const row = (
        <TokenSelectorV2RowItem
          index={index}
          categories={categories}
          option={item}
          section={section as OnchainItemSection<TokenOption>}
          showTokenAddress={showTokenAddress}
          showTokenWarnings={showTokenWarnings}
          onSelectToken={handleTokenPress}
        />
      )

      return wrapTokenRow ? wrapTokenRow(row, item.currencyInfo) : row
    },
    [
      categories,
      handleExpand,
      handleTokenPress,
      isExpandedItem,
      onSelectRwaToken,
      showTokenAddress,
      showTokenWarnings,
      suggestedTilesMaxCount,
      wrapTokenRow,
    ],
  )

  const showLoadingSkeleton = Boolean(loading && !sections?.length && !hasError)

  return (
    <Flex fill position="relative">
      <SelectorBaseList<TokenSelectorListOption>
        chainFilter={chainFilter}
        emptyElement={emptyElement}
        errorText={errorText}
        expandedItems={expandedItems}
        hasError={hasError}
        keyExtractor={key}
        loading={loading}
        refetch={refetch}
        renderItem={renderItem}
        renderedInModal={renderedInModal}
        sections={taggedSections}
      />
      {/* Covers the shared list's 3-row skeleton with one tall enough for the V2 pane */}
      {showLoadingSkeleton && <TokenSelectorV2SkeletonOverlay />}
      {pendingModal}
    </Flex>
  )
})
