import { isHoverable } from '@universe/environment'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { TestID } from '@universe/test'
import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { FocusedRow, useCreateFocusedRowStore } from 'uniswap/src/components/lists/focusedRowStore'
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
import { SEARCH_MAX_SYMBOL_CHARACTERS } from 'uniswap/src/features/search/SearchModal/constants'
import { useSearchEarnApy } from 'uniswap/src/features/search/SearchModal/hooks/useSearchEarnApy'
import {
  SearchModalOptionSelection,
  useSearchModalOptionSelection,
} from 'uniswap/src/features/search/SearchModal/hooks/useSearchModalOptionSelection'
import { RecentSearchPills } from 'uniswap/src/features/search/SearchModal/RecentSearchPills/RecentSearchPills'
import { RwaCollectionItem } from 'uniswap/src/features/search/SearchModal/RwaCollectionItem'
import { RwaIssuerRow } from 'uniswap/src/features/search/SearchModal/RwaIssuerRow'
import { getRwaCollectionKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { getRwaIssuerCurrencyInfo } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerCurrencyInfos'
import type { SearchModalRowWrapper, SearchModalRowWrapperProps } from 'uniswap/src/features/search/SearchModal/types'
import {
  searchModalListOptionKey,
  toggleKeyInList,
} from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'
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
  /** Mobile rows are too narrow for a secondary category pill beside the name. */
  hideTokenCategoryTag?: boolean
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
  hideTokenCategoryTag = false,
  onResultsShownChange,
}: SearchModalListProps): JSX.Element {
  const { chains: enabledChainIds } = useEnabledChains()
  // Subscribed once here, not per row: `renderItem` is a plain function, so rows can't use hooks.
  const { categories } = useAllTokenCategories()
  const getEarnApyPercent = useSearchEarnApy()

  const resultsShown = useMemo(() => countSearchResultRows(sections), [sections])
  useEffect(() => {
    onResultsShownChange?.(resultsShown)
  }, [onResultsShownChange, resultsShown])

  const focusedRowStore = useCreateFocusedRowStore()
  const { setFocusedRowIndex } = focusedRowStore
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const wrapRow = useCallback(
    (props: SearchModalRowWrapperProps): JSX.Element => (rowWrapper ? rowWrapper(props) : props.element),
    [rowWrapper],
  )

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
          // Sub-rows' right edge holds issuer stats, so they drop the `…` menu; the collapsed single-issuer row keeps it.
          hideContextMenu={ownsTouchable}
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
    [rwaIssuerCurrencyInfos, enabledChainIds, rowWrapper],
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

  // Memoized: the list rebuilds every row object when `renderItem` changes identity, which re-renders
  // every mounted row. Deps are the values the rows actually read, so a category or issuer load still
  // reaches them.
  const renderItem = useCallback(
    ({ item, section, rowIndex, index, expanded }: ItemRowInfo<SearchModalListOption>): JSX.Element => {
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
          const poolElement = (
            <PoolOptionItem
              token0CurrencyInfo={item.token0CurrencyInfo}
              token1CurrencyInfo={item.token1CurrencyInfo}
              poolId={item.poolId}
              chainId={item.chainId}
              protocolVersion={item.protocolVersion}
              hookAddress={item.hookAddress}
              feeTier={item.feeTier}
              searchStats={{ volume1dUsd: item.volume1dUsd, apr: item.apr }}
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              modifierPressHref={modifierPressHref}
              onPress={onPress}
              onModifierPress={onModifierPress}
            />
          )
          return wrapRow({ element: poolElement, pool: item, variant: 'pool' })
        }
        case OnchainItemListOptionType.Token: {
          const tokenElement = (
            <TokenOptionItem
              showIssuerTag
              hideContextMenu
              option={item}
              displayName={item.rwaName}
              issuer={item.rwaIssuer}
              categoryTag={
                hideTokenCategoryTag || section.categoryId
                  ? undefined
                  : getRowCategoryTag({
                      rwaCategory: item.rwaCategory,
                      categoryIds: item.currencyInfo.categoryIds,
                      categories,
                    })
              }
              categoryTagPlacement="title"
              contextMenuVariant={TokenContextMenuVariant.Search}
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              searchStats={item.currencyInfo.searchStats}
              earnApyPercent={getEarnApyPercent([item.currencyInfo.currencyId])}
              symbolMaxCharacters={SEARCH_MAX_SYMBOL_CHARACTERS}
              modifierPressHref={modifierPressHref}
              onPress={onPress}
              onModifierPress={onModifierPress}
            />
          )
          return wrapRow({ element: tokenElement, currencyInfo: item.currencyInfo, variant: 'token' })
        }
        case OnchainItemListOptionType.MultichainToken: {
          const multichainElement = (
            <TokenOptionItem
              showIssuerTag
              hideNetworkCount
              hideContextMenu
              option={{
                type: OnchainItemListOptionType.Token,
                currencyInfo: item.primaryCurrencyInfo,
                quantity: null,
                balanceUSD: undefined,
              }}
              displayName={item.rwaName ?? item.multichainResult.name}
              issuer={item.rwaIssuer}
              networkCount={item.multichainResult.tokens.length}
              categoryTag={
                hideTokenCategoryTag || section.categoryId
                  ? undefined
                  : getRowCategoryTag({
                      rwaCategory: item.rwaCategory,
                      categoryIds: item.primaryCurrencyInfo.categoryIds,
                      categories,
                    })
              }
              categoryTagPlacement="title"
              searchStats={item.multichainResult.stats}
              earnApyPercent={getEarnApyPercent(item.multichainResult.tokens.map((token) => token.currencyId))}
              symbolMaxCharacters={SEARCH_MAX_SYMBOL_CHARACTERS}
              contextMenuVariant={TokenContextMenuVariant.Search}
              multichainData={{
                tokens: item.multichainResult.tokens,
                primaryCurrencyInfo: item.primaryCurrencyInfo,
              }}
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              modifierPressHref={modifierPressHref}
              onPress={onPress}
              onModifierPress={onModifierPress}
            />
          )
          return wrapRow({ element: multichainElement, currencyInfo: item.primaryCurrencyInfo, variant: 'token' })
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
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              renderIssuerRow={renderRwaIssuerRow}
              isIssuerMenuReady={isRwaIssuerMenuReady}
              testID={`${TestID.SearchRwaCollectionPrefix}${rwa.symbol}`}
              searchStats={item.searchStats}
              onToggle={() => toggleExpanded(getRwaCollectionKey({ rwa }))}
              onSelect={onSelect}
            />
          )
        }
        case OnchainItemListOptionType.WalletByAddress:
          return wrapRow({
            variant: 'wallet',
            element: (
              <WalletByAddressOptionItem
                walletByAddressOption={item}
                modifierPressHref={modifierPressHref}
                onPress={onPress}
                onModifierPress={onModifierPress}
              />
            ),
            address: item.address,
          })
        case OnchainItemListOptionType.ENSAddress:
          return wrapRow({
            variant: 'wallet',
            element: (
              <ENSAddressOptionItem
                ensAddressOption={item}
                modifierPressHref={modifierPressHref}
                onPress={onPress}
                onModifierPress={onModifierPress}
              />
            ),
            address: item.address,
          })
        case OnchainItemListOptionType.EarnVault:
          return (
            <EarnVaultOptionItem
              option={item}
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              rightElement={
                isHoverable ? (
                  <FocusedRow rowIndex={rowIndex}>
                    {(isRowFocused) => (isRowFocused ? <ArrowRight color="$neutral2" size="$icon.20" /> : null)}
                  </FocusedRow>
                ) : undefined
              }
              onPress={onPress}
            />
          )
        case OnchainItemListOptionType.Category:
          return (
            <CategoryOptionItem
              option={item}
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              modifierPressHref={modifierPressHref}
              onPress={onPress}
              onModifierPress={onModifierPress}
            />
          )
        case OnchainItemListOptionType.Unitag:
          return wrapRow({
            variant: 'wallet',
            element: (
              <UnitagOptionItem
                unitagOption={item}
                modifierPressHref={modifierPressHref}
                onPress={onPress}
                onModifierPress={onModifierPress}
              />
            ),
            address: item.address,
          })
        case OnchainItemListOptionType.Auction: {
          const auctionElement = (
            <AuctionOptionItem
              option={item}
              focusedRowControl={{ rowIndex, setFocusedRowIndex }}
              searchStats={item.searchStats}
              onPress={onPress}
            />
          )
          return wrapRow({ element: auctionElement, variant: 'auction', auction: item })
        }
        default:
          return <></>
      }
    },
    [
      categories,
      getModifierPressHref,
      getEarnApyPercent,
      hideTokenCategoryTag,
      isRwaIssuerMenuReady,
      onSelect,
      recordSelection,
      renderRwaIssuerRow,
      searchFilters,
      selectOption,
      setFocusedRowIndex,
      toggleExpanded,
      wrapRow,
    ],
  )

  return (
    <SelectorBaseList<SearchModalListOption>
      focusedRowStore={focusedRowStore}
      autoFocusFirstRowKey={resetKey}
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
