import { isHoverable } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { TestID } from '@universe/test'
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { AuctionOptionItem } from 'uniswap/src/components/lists/items/auctions/AuctionOptionItem'
import { CategoryOptionItem } from 'uniswap/src/components/lists/items/categories/CategoryOptionItem'
import { EarnVaultOptionItem } from 'uniswap/src/components/lists/items/earn/EarnVaultOptionItem'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import { TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/TokenOptionItem'
import { TokenContextMenuVariant } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/types'
import { OnchainItemListOptionType, SearchModalListOption } from 'uniswap/src/components/lists/items/types'
import { ENSAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/ENSAddressOptionItem'
import { UnitagOptionItem } from 'uniswap/src/components/lists/items/wallets/UnitagOptionItem'
import { WalletByAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletByAddressOptionItem'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { OnchainItemSectionName, type OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useAllTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useAllTokenCategories'
import type { IssuerToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { countSearchResultRows } from 'uniswap/src/features/search/SearchModal/analytics/countSearchResultRows'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { withCategoryHeaderActions } from 'uniswap/src/features/search/SearchModal/categories/withCategoryHeaderActions'
import { SEARCH_V2_MAX_SYMBOL_CHARACTERS } from 'uniswap/src/features/search/SearchModal/constants'
import { useSearchEarnApy } from 'uniswap/src/features/search/SearchModal/hooks/useSearchEarnApy'
import {
  SearchModalOptionSelection,
  useSearchModalOptionSelection,
} from 'uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection'
import { PoolRowContextMenuButton } from 'uniswap/src/features/search/SearchModal/PoolRowContextMenuButton'
import { RecentSearchPills } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/RecentSearchPills'
import { RwaCollectionItem } from 'uniswap/src/features/search/SearchModal/RwaCollectionItem'
import { RwaIssuerRow } from 'uniswap/src/features/search/SearchModal/RwaIssuerRow'
import { getRwaCollectionKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { getRwaIssuerCurrencyInfo } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerCurrencyInfos'
import { TokenRowContextMenuButton } from 'uniswap/src/features/search/SearchModal/TokenRowContextMenuButton'
import type { SearchModalRowWrapper } from 'uniswap/src/features/search/SearchModal/types'
import {
  searchModalListOptionKey,
  toggleKeyInList,
} from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'
import type { CategoryTagPlacement } from 'uniswap/src/features/tokenCategories/CategoryTagPill'
import { getRowCategoryTag } from 'uniswap/src/features/tokenCategories/getRowCategoryTag'
import { useEvent } from 'utilities/src/react/hooks'

export interface SearchModalListProps {
  sections?: OnchainItemSection<SearchModalListOption>[]
  refetch?: () => void
  loading?: boolean
  loadingElement?: JSX.Element
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  onSelect?: () => void
  searchFilters: SearchFilterContext
  renderedInModal: boolean
  contentContainerStyle?: StyleProp<ViewStyle>
  rowWrapper?: SearchModalRowWrapper
  /** Resolved primary-chain CurrencyInfos keyed by normalized currencyId, used by the RwaCollection rows' context
   *  menu. */
  rwaIssuerCurrencyInfos?: Map<string, CurrencyInfo>
  onResultsShownChange?: (count: number) => void
}

export const SearchModalList = memo(function SearchModalListInner({
  sections,
  refetch,
  loading,
  loadingElement,
  hasError,
  emptyElement,
  errorText,
  onSelect,
  searchFilters,
  renderedInModal,
  contentContainerStyle,
  rowWrapper,
  rwaIssuerCurrencyInfos,
  onResultsShownChange,
}: SearchModalListProps): JSX.Element {
  const { chains: enabledChainIds } = useEnabledChains()
  const isSearchV2UIEnabled = useFeatureFlag(FeatureFlags.SearchV2UI)
  // V2 frees the right edge for stats by moving the pill beside the name and the chevron inline.
  const categoryTagPlacement: CategoryTagPlacement = isSearchV2UIEnabled ? 'title' : 'right'
  const symbolMaxCharacters = isSearchV2UIEnabled ? SEARCH_V2_MAX_SYMBOL_CHARACTERS : undefined
  // Subscribed once here, not per row: `renderItem` is a plain function, so rows can't use hooks.
  const { categories } = useAllTokenCategories()
  const getEarnApyPercent = useSearchEarnApy({ enabled: isSearchV2UIEnabled })

  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const resultsShown = useMemo(() => countSearchResultRows(sections), [sections])
  useEffect(() => {
    onResultsShownChange?.(resultsShown)
  }, [onResultsShownChange, resultsShown])

  // Auction rows only get a hover card under Search V2 (token rows always do).
  // Not gated on the auction-search flag: that governs whether auction rows are fetched at all.
  const auctionRowWrapper = isSearchV2UIEnabled ? rowWrapper : undefined
  const wrapTokenRow = ({ element, currencyInfo }: { element: JSX.Element; currencyInfo: CurrencyInfo }): JSX.Element =>
    rowWrapper ? rowWrapper({ element, currencyInfo, variant: 'token' }) : element

  // Reset expand-state during render (not in an effect, which would flash a stale expansion for one frame)
  // when the search context changes; a stale key would re-expand an unrelated same-keyed row, growing unbounded.
  const resetKey = `${searchFilters.query ?? ''}|${searchFilters.searchChainFilter ?? ''}|${searchFilters.searchTabFilter}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setExpandedItems([])
  }

  const toggleExpanded = useEvent((itemKey: string): void => {
    setExpandedItems((prev) => toggleKeyInList(prev, itemKey))
  })

  // One renderIssuerRow factory for every RwaCollection row. Defined here at the top level — NOT inside `renderItem`,
  // which is invoked as a plain function (web `itemData.renderItem(itemData)`, native `renderItem(item.data)`), so a
  // hook inside the RwaCollection case would violate the rules of hooks. Threads each issuer's resolved primary-chain
  // CurrencyInfo + its raw chainTokens (the multichain Copy fan-out reads them). `issuer.chainTokens` is a call
  // argument, not a closure dep, so the deps stay minimal.
  const renderRwaIssuerRow = useCallback(
    ({
      issuer,
      isRowFocused,
      onPress,
      ownsTouchable,
      menuControl,
      modifierPressHref,
      onModifierPress,
      children,
    }: RenderIssuerRowArgs): ReactNode => {
      const currencyInfo = rwaIssuerCurrencyInfos
        ? getRwaIssuerCurrencyInfo({ issuer, enabledChainIds, currencyInfos: rwaIssuerCurrencyInfos })
        : undefined
      const issuerRow = (
        <RwaIssuerRow
          isRowFocused={isRowFocused}
          ownsTouchable={ownsTouchable}
          menuControl={menuControl}
          currencyInfo={currencyInfo}
          issuerChainTokens={issuer.chainTokens}
          // V2 sub-rows' right edge holds issuer stats, so they drop the `…` menu; the collapsed single-issuer row keeps it.
          hideContextMenu={isSearchV2UIEnabled && ownsTouchable}
          modifierPressHref={modifierPressHref}
          onPress={onPress}
          onModifierPress={onModifierPress}
        >
          {children}
        </RwaIssuerRow>
      )
      // `ownsTouchable` is true only for the expanded multi-issuer sub-rows (the collection's child rows) — the
      // collapsed single-issuer row reuses this same renderer with `ownsTouchable: false` for the shell's parent
      // row, which must NOT get the hover chart card.
      return ownsTouchable && rowWrapper && currencyInfo
        ? rowWrapper({ element: issuerRow, currencyInfo, variant: 'rwaIssuerChild' })
        : issuerRow
    },
    [rwaIssuerCurrencyInfos, enabledChainIds, rowWrapper, isSearchV2UIEnabled],
  )

  // Gate the collapsed single-issuer row's native long-press: only let it open once the issuer's primary-chain
  // CurrencyInfo has resolved (the same condition under which the menu can mount in RwaIssuerRow). Without this the
  // long-press would latch the controlled menu open while the row is still menu-less, popping it open on its own when
  // the batched query lands. useEvent → stable identity that reads the latest resolved Map; the row re-renders on
  // resolution (the resolved Map flows through renderRwaIssuerRow), re-evaluating this fresh.
  const isRwaIssuerMenuReady = useEvent((issuer: IssuerToken): boolean =>
    Boolean(
      rwaIssuerCurrencyInfos &&
      getRwaIssuerCurrencyInfo({ issuer, enabledChainIds, currencyInfos: rwaIssuerCurrencyInfos }),
    ),
  )

  const { getModifierPressHref, recordSelection, selectOption } = useSearchModalOptionSelection({
    searchFilters,
    onSelect,
  })

  const { navigateToCategoryDetails } = useUniswapContext()
  const openCategoryDetails = useEvent((selection: SearchModalOptionSelection): void => selectOption(selection))
  const sectionsWithHeaderActions = useMemo(
    () =>
      navigateToCategoryDetails ? withCategoryHeaderActions({ sections, categories, openCategoryDetails }) : sections,
    [sections, categories, navigateToCategoryDetails, openCategoryDetails],
  )

  const renderItem = ({
    item,
    section,
    rowIndex,
    index,
    expanded,
  }: ItemRowInfo<SearchModalListOption>): JSX.Element => {
    if (Array.isArray(item)) {
      // Horizontal renderers dispatch on sectionKey (same mechanism as TokenSelectorV2List).
      if (section.sectionKey !== OnchainItemSectionName.RecentSearches) {
        return <></>
      }
      return (
        <RecentSearchPills
          getModifierPressHref={getModifierPressHref}
          options={item}
          rowIndex={rowIndex}
          section={section}
          onModifierPress={recordSelection}
          onSelectOption={selectOption}
        />
      )
    }

    const selection: SearchModalOptionSelection = { item, section, index, rowIndex }
    const onPress = (): void => selectOption(selection)
    const onModifierPress = (): void => recordSelection(selection)
    const modifierPressHref = getModifierPressHref(item)

    switch (item.type) {
      case OnchainItemListOptionType.Pool: {
        return (
          <PoolOptionItem
            token0CurrencyInfo={item.token0CurrencyInfo}
            token1CurrencyInfo={item.token1CurrencyInfo}
            poolId={item.poolId}
            chainId={item.chainId}
            protocolVersion={item.protocolVersion}
            hookAddress={item.hookAddress}
            feeTier={item.feeTier}
            identityPlacement={isSearchV2UIEnabled ? 'subtitle' : 'badge'}
            searchStats={isSearchV2UIEnabled ? { volume1dUsd: item.volume1dUsd, apr: item.apr } : undefined}
            focusedRowControl={{
              rowIndex,
              setFocusedRowIndex,
              focusedRowIndex,
            }}
            rightElement={
              // V2 gives the right edge to vol/APR, like the token rows; long-press/right-click still opens the menu.
              !isSearchV2UIEnabled && isHoverable ? (
                <PoolRowContextMenuButton
                  poolId={item.poolId}
                  chainId={item.chainId}
                  protocolVersion={item.protocolVersion}
                  isVisible={rowIndex === focusedRowIndex}
                />
              ) : undefined
            }
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
      }
      case OnchainItemListOptionType.Token: {
        const tokenElement = (
          <TokenOptionItem
            showTokenAddress
            option={item}
            displayName={item.rwaName}
            issuer={item.rwaIssuerSlug}
            showIssuerTag={isSearchV2UIEnabled}
            categoryTag={getRowCategoryTag({
              rwaCategory: item.rwaCategory,
              categoryIds: item.currencyInfo.categoryIds,
              categories,
              scopedCategoryId: section.categoryId,
            })}
            categoryTagPlacement={categoryTagPlacement}
            contextMenuVariant={TokenContextMenuVariant.Search}
            focusedRowControl={{
              focusedRowIndex,
              setFocusedRowIndex,
              rowIndex,
            }}
            searchStats={isSearchV2UIEnabled ? item.currencyInfo.searchStats : undefined}
            earnApyPercent={getEarnApyPercent([item.currencyInfo.currencyId])}
            symbolMaxCharacters={symbolMaxCharacters}
            hideContextMenu={isSearchV2UIEnabled}
            rightElement={
              !isSearchV2UIEnabled && isHoverable ? (
                <TokenRowContextMenuButton
                  currency={item.currencyInfo.currency}
                  isVisible={rowIndex === focusedRowIndex}
                />
              ) : undefined
            }
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
        return wrapTokenRow({ element: tokenElement, currencyInfo: item.currencyInfo })
      }
      case OnchainItemListOptionType.MultichainToken: {
        const multichainElement = (
          <TokenOptionItem
            option={{
              type: OnchainItemListOptionType.Token,
              currencyInfo: item.primaryCurrencyInfo,
              quantity: null,
              balanceUSD: undefined,
            }}
            displayName={item.rwaName ?? item.multichainResult.name}
            issuer={item.rwaIssuerSlug}
            showIssuerTag={isSearchV2UIEnabled}
            networkCount={item.multichainResult.tokens.length}
            categoryTag={getRowCategoryTag({
              rwaCategory: item.rwaCategory,
              categoryIds: item.primaryCurrencyInfo.categoryIds,
              categories,
              scopedCategoryId: section.categoryId,
            })}
            categoryTagPlacement={categoryTagPlacement}
            searchStats={isSearchV2UIEnabled ? item.multichainResult.stats : undefined}
            earnApyPercent={getEarnApyPercent(item.multichainResult.tokens.map((token) => token.currencyId))}
            symbolMaxCharacters={symbolMaxCharacters}
            hideContextMenu={isSearchV2UIEnabled}
            contextMenuVariant={TokenContextMenuVariant.Search}
            multichainData={{
              tokens: item.multichainResult.tokens,
              primaryCurrencyInfo: item.primaryCurrencyInfo,
            }}
            focusedRowControl={{
              focusedRowIndex,
              setFocusedRowIndex,
              rowIndex,
            }}
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
        return wrapTokenRow({ element: multichainElement, currencyInfo: item.primaryCurrencyInfo })
      }
      case OnchainItemListOptionType.RwaCollection: {
        const { rwa } = item
        return (
          <RwaCollectionItem
            item={item}
            expanded={Boolean(expanded)}
            searchFilters={searchFilters}
            section={section}
            index={index}
            rowIndex={rowIndex}
            focusedRowControl={{ rowIndex, setFocusedRowIndex, focusedRowIndex }}
            renderIssuerRow={renderRwaIssuerRow}
            isIssuerMenuReady={isRwaIssuerMenuReady}
            testID={`${TestID.SearchRwaCollectionPrefix}${rwa.symbol}`}
            searchStats={isSearchV2UIEnabled ? item.searchStats : undefined}
            showIssuerStats={isSearchV2UIEnabled}
            showIssuerTag={isSearchV2UIEnabled}
            categoryTagPlacement={categoryTagPlacement}
            onToggle={() => toggleExpanded(getRwaCollectionKey({ rwa }))}
            onSelect={onSelect}
          />
        )
      }
      case OnchainItemListOptionType.WalletByAddress:
        return (
          <WalletByAddressOptionItem
            walletByAddressOption={item}
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
      case OnchainItemListOptionType.ENSAddress:
        return (
          <ENSAddressOptionItem
            ensAddressOption={item}
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
      case OnchainItemListOptionType.EarnVault:
        return (
          <EarnVaultOptionItem
            option={item}
            focusedRowControl={{
              focusedRowIndex,
              setFocusedRowIndex,
              rowIndex,
            }}
            rightElement={
              isHoverable && rowIndex === focusedRowIndex ? <ArrowRight color="$neutral2" size="$icon.20" /> : undefined
            }
            onPress={onPress}
          />
        )
      case OnchainItemListOptionType.Category:
        return (
          <CategoryOptionItem
            option={item}
            focusedRowControl={{ focusedRowIndex, setFocusedRowIndex, rowIndex }}
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
      case OnchainItemListOptionType.Unitag:
        return (
          <UnitagOptionItem
            unitagOption={item}
            modifierPressHref={modifierPressHref}
            onPress={onPress}
            onModifierPress={onModifierPress}
          />
        )
      case OnchainItemListOptionType.Auction: {
        const auctionElement = (
          <AuctionOptionItem
            option={item}
            focusedRowControl={{
              rowIndex,
              setFocusedRowIndex,
              focusedRowIndex,
            }}
            onPress={onPress}
          />
        )
        return auctionRowWrapper
          ? auctionRowWrapper({ element: auctionElement, variant: 'auction', auction: item })
          : auctionElement
      }
      default:
        return <></>
    }
  }

  return (
    <SelectorBaseList<SearchModalListOption>
      focusedRowControl={{
        focusedRowIndex,
        setFocusedRowIndex,
      }}
      autoFocusFirstRowKey={isSearchV2UIEnabled ? resetKey : undefined}
      renderItem={renderItem}
      sections={sectionsWithHeaderActions}
      expandedItems={expandedItems}
      chainFilter={searchFilters.searchChainFilter}
      refetch={refetch}
      loading={loading}
      loadingElement={loadingElement}
      hasError={hasError}
      emptyElement={emptyElement}
      errorText={errorText}
      keyExtractor={searchModalListOptionKey}
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
    />
  )
})
