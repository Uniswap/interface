/* oxlint-disable max-lines -- cohesive renderItem switch over every search-result option type */
import { ContentStyle } from '@shopify/flash-list'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { isHoverable } from '@universe/environment'
import { memo, useCallback, useState, type ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { Flex } from 'ui/src'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import {
  PoolContextMenuAction,
  PoolOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { TokenContextMenuVariant, TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { ENSAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/ENSAddressOptionItem'
import { UnitagOptionItem } from 'uniswap/src/components/lists/items/wallets/UnitagOptionItem'
import { WalletByAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletByAddressOptionItem'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ContextMenuTriggerButton } from 'uniswap/src/components/menus/ContextMenuTriggerButton'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'
import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import type { IssuerToken } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId, toSupportedChainId } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import { ExpandableAssetGroup } from 'uniswap/src/features/expandableAsset/ExpandableAssetGroup'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { useDelayedMenuClose } from 'uniswap/src/features/search/SearchModal/hooks/useDelayedMenuClose'
import { MultichainTokenContextMenuButton } from 'uniswap/src/features/search/SearchModal/MultichainTokenContextMenuButton'
import { RwaIssuerRow } from 'uniswap/src/features/search/SearchModal/RwaIssuerRow'
import { getRwaCollectionKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { getRwaIssuerCurrencyInfo } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerCurrencyInfos'
import { TokenRowContextMenuButton } from 'uniswap/src/features/search/SearchModal/TokenRowContextMenuButton'
import { isAddressTokenSearchQuery } from 'uniswap/src/features/search/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { tdpChainSelectionFromFilter } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

/**
 * Resolves TDP network intent: recents override, then search network filter, then (only for **address** searches)
 * the row’s chain so symbol/name searches still open the aggregated multichain view.
 */
function tdpChainFilterForTokenRow({
  searchChainFilter,
  rowCurrency,
  explicitTdpChain,
  searchQuery,
  allowAggregate,
}: {
  searchChainFilter: UniverseChainId | null
  rowCurrency: Currency
  explicitTdpChain?: UniverseChainId
  searchQuery?: string
  allowAggregate?: boolean
}): UniverseChainId | null | undefined {
  if (explicitTdpChain != null) {
    return explicitTdpChain
  }
  if (searchChainFilter != null) {
    return searchChainFilter
  }
  if (isAddressTokenSearchQuery(searchQuery)) {
    return isUniverseChainId(rowCurrency.chainId) ? rowCurrency.chainId : undefined
  }
  return allowAggregate ? null : undefined
}

// Context menu button component that manages its own state
const PoolRowContextMenuButton = memo(function PoolRowContextMenuButton({
  poolId,
  chainId,
  protocolVersion,
  isVisible = true,
}: {
  poolId: string
  chainId: UniverseChainId
  protocolVersion: ProtocolVersion
  isVisible?: boolean
}): JSX.Element {
  const { value: isOpen, setTrue: openMenu, setFalse: closeMenu } = useBooleanState(false)
  useDelayedMenuClose({ isVisible, isOpen, closeMenu })

  const shouldShow = isVisible || isOpen

  return (
    <Flex opacity={shouldShow ? 1 : 0} pointerEvents={shouldShow ? 'auto' : 'none'}>
      <PoolOptionItemContextMenu
        actions={[PoolContextMenuAction.CopyAddress, PoolContextMenuAction.Share]}
        isOpen={isOpen}
        openMenu={openMenu}
        closeMenu={closeMenu}
        poolId={poolId}
        chainId={chainId}
        protocolVersion={protocolVersion}
        triggerMode={ContextMenuTriggerMode.Primary}
      >
        <ContextMenuTriggerButton />
      </PoolOptionItemContextMenu>
    </Flex>
  )
})

function toggleKeyInList(list: string[], itemKey: string): string[] {
  return list.includes(itemKey) ? list.filter((existing) => existing !== itemKey) : [...list, itemKey]
}

export interface SearchModalListProps {
  sections?: OnchainItemSection<SearchModalOption>[]
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  onSelect?: () => void
  searchFilters: SearchFilterContext
  renderedInModal: boolean
  contentContainerStyle?: ContentStyle
  wrapTokenRow?: (element: JSX.Element, currencyInfo: CurrencyInfo) => JSX.Element
  /** Resolved primary-chain CurrencyInfos keyed by normalized currencyId, used by the RwaCollection rows' context
   *  menu. */
  rwaIssuerCurrencyInfos?: Map<string, CurrencyInfo>
}

export const SearchModalList = memo(function SearchModalListInner({
  sections,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  onSelect,
  searchFilters,
  renderedInModal,
  contentContainerStyle,
  wrapTokenRow,
  rwaIssuerCurrencyInfos,
}: SearchModalListProps): JSX.Element {
  const { navigateToTokenDetails, navigateToExternalProfile, navigateToPoolDetails } = useUniswapContext()
  const { registerSearchItem } = useAddToSearchHistory()
  const dispatch = useDispatch()
  const { chains: enabledChainIds } = useEnabledChains()

  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

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
    ({ issuer, isRowFocused, onPress, ownsTouchable, menuControl, children }: RenderIssuerRowArgs): ReactNode => (
      <RwaIssuerRow
        isRowFocused={isRowFocused}
        ownsTouchable={ownsTouchable}
        menuControl={menuControl}
        currencyInfo={
          rwaIssuerCurrencyInfos
            ? getRwaIssuerCurrencyInfo({ issuer, enabledChainIds, currencyInfos: rwaIssuerCurrencyInfos })
            : undefined
        }
        issuerChainTokens={issuer.chainTokens}
        onPress={onPress}
      >
        {children}
      </RwaIssuerRow>
    ),
    [rwaIssuerCurrencyInfos, enabledChainIds],
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

  // oxlint-disable-next-line typescript/consistent-return
  const renderItem = ({ item, section, rowIndex, index, expanded }: ItemRowInfo<SearchModalOption>): JSX.Element => {
    switch (item.type) {
      case OnchainItemListOptionType.Pool:
        return (
          <PoolOptionItem
            token0CurrencyInfo={item.token0CurrencyInfo}
            token1CurrencyInfo={item.token1CurrencyInfo}
            poolId={item.poolId}
            chainId={item.chainId}
            protocolVersion={item.protocolVersion}
            hookAddress={item.hookAddress}
            feeTier={item.feeTier}
            focusedRowControl={{
              rowIndex,
              setFocusedRowIndex,
              focusedRowIndex,
            }}
            rightElement={
              isHoverable ? (
                <PoolRowContextMenuButton
                  poolId={item.poolId}
                  chainId={item.chainId}
                  protocolVersion={item.protocolVersion}
                  isVisible={rowIndex === focusedRowIndex}
                />
              ) : undefined
            }
            onPress={() => {
              registerSearchItem(item)

              navigateToPoolDetails({ poolId: item.poolId, chainId: item.chainId })

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
                sectionIndex: index,
                rowIndex,
                searchFilters,
              })

              onSelect?.()
            }}
          />
        )
      case OnchainItemListOptionType.Token: {
        const tokenElement = (
          <TokenOptionItem
            showTokenAddress
            option={item}
            displayName={item.rwaName}
            issuerLabel={item.rwaIssuerSlug ? formatIssuerLabel(item.rwaIssuerSlug) : undefined}
            categoryTag={item.rwaCategory != null ? <CategoryTag category={item.rwaCategory} /> : undefined}
            contextMenuVariant={TokenContextMenuVariant.Search}
            focusedRowControl={{
              focusedRowIndex,
              setFocusedRowIndex,
              rowIndex,
            }}
            rightElement={
              isHoverable ? (
                <TokenRowContextMenuButton
                  currency={item.currencyInfo.currency}
                  isVisible={rowIndex === focusedRowIndex}
                />
              ) : undefined
            }
            onPress={() => {
              const tdpChain = tdpChainFilterForTokenRow({
                searchChainFilter: searchFilters.searchChainFilter,
                rowCurrency: item.currencyInfo.currency,
                searchQuery: searchFilters.query,
              })
              registerSearchItem(item, { tdpChainFilter: tdpChain })

              navigateToTokenDetails(item.currencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain))

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
                sectionIndex: index,
                rowIndex,
                searchFilters,
              })

              onSelect?.()
            }}
          />
        )
        return wrapTokenRow ? wrapTokenRow(tokenElement, item.currencyInfo) : tokenElement
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
            issuerLabel={item.rwaIssuerSlug ? formatIssuerLabel(item.rwaIssuerSlug) : undefined}
            networkCount={item.multichainResult.tokens.length}
            categoryTag={item.rwaCategory != null ? <CategoryTag category={item.rwaCategory} /> : undefined}
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
            rightElement={
              isHoverable ? (
                <MultichainTokenContextMenuButton
                  multichainResult={item.multichainResult}
                  primaryCurrencyInfo={item.primaryCurrencyInfo}
                  isVisible={rowIndex === focusedRowIndex}
                />
              ) : undefined
            }
            onPress={() => {
              const tdpChain = tdpChainFilterForTokenRow({
                searchChainFilter: searchFilters.searchChainFilter,
                rowCurrency: item.primaryCurrencyInfo.currency,
                explicitTdpChain: item.tdpChainFilter,
                searchQuery: searchFilters.query,
                allowAggregate: true,
              })
              registerSearchItem(item, { tdpChainFilter: tdpChain })

              navigateToTokenDetails(item.primaryCurrencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain))

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
                sectionIndex: index,
                rowIndex,
                searchFilters,
              })

              onSelect?.()
            }}
          />
        )
        return wrapTokenRow ? wrapTokenRow(multichainElement, item.primaryCurrencyInfo) : multichainElement
      }
      case OnchainItemListOptionType.RwaCollection: {
        const { rwa } = item
        const canExpand = rwa.issuerTokens.length > 1
        const selectIssuer = (issuer?: IssuerToken): void => {
          // Navigate to the issuer's displayed primary chain — the first enabled chainToken (chainTokens are
          // sorted mainnet-first upstream) — so navigation, the row's logo, and analytics target the same chain.
          const chainToken = issuer && pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
          const chainId = chainToken && toSupportedChainId(chainToken.chainId)
          if (!chainToken || !chainId) {
            logger.warn('SearchModalList', 'selectIssuer', 'RWA issuer has no enabled/supported chainToken', {
              issuer: issuer?.issuer,
              symbol: rwa.symbol,
            })
            return
          }
          // Record a token search-history entry directly — RWA data has no SDK Currency, so do NOT
          // build a CurrencyInfo / call registerSearchItem's Token branch. Recents reconstitute it.
          dispatch(
            addToSearchHistory({
              searchResult: {
                type: SearchHistoryResultType.Token,
                chainId,
                address: chainToken.address,
              },
            }),
          )
          navigateToTokenDetails(buildCurrencyId(chainId, chainToken.address))
          sendSearchOptionItemClickedAnalytics({
            item,
            section,
            sectionIndex: index,
            rowIndex,
            searchFilters,
            rwaSelection: { chainId, address: chainToken.address },
          })
          onSelect?.()
        }
        return (
          <ExpandableAssetGroup
            asset={rwa}
            enabledChainIds={enabledChainIds}
            isExpanded={Boolean(expanded)}
            showCategoryTag={item.showCategoryTag ?? true}
            focusedRowControl={{ rowIndex, setFocusedRowIndex, focusedRowIndex }}
            testID={`${TestID.SearchRwaCollectionPrefix}${rwa.symbol}`}
            renderIssuerRow={renderRwaIssuerRow}
            isIssuerMenuReady={isRwaIssuerMenuReady}
            onToggle={() => toggleExpanded(getRwaCollectionKey({ rwa }))}
            onParentPress={canExpand ? undefined : () => selectIssuer(rwa.issuerTokens[0])}
            onIssuerPress={selectIssuer}
          />
        )
      }
      case OnchainItemListOptionType.WalletByAddress:
        return (
          <WalletByAddressOptionItem
            walletByAddressOption={item}
            onPress={() => {
              navigateToExternalProfile({ address: item.address })

              registerSearchItem(item)

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
                sectionIndex: index,
                rowIndex,
                searchFilters,
              })

              onSelect?.()
            }}
          />
        )
      case OnchainItemListOptionType.ENSAddress:
        return (
          <ENSAddressOptionItem
            ensAddressOption={item}
            onPress={() => {
              navigateToExternalProfile({ address: item.address })

              registerSearchItem(item)

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
                sectionIndex: index,
                rowIndex,
                searchFilters,
              })

              onSelect?.()
            }}
          />
        )
      case OnchainItemListOptionType.Unitag:
        return (
          <UnitagOptionItem
            unitagOption={item}
            onPress={() => {
              navigateToExternalProfile({ address: item.address })

              registerSearchItem(item)

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
                sectionIndex: index,
                rowIndex,
                searchFilters,
              })

              onSelect?.()
            }}
          />
        )
    }
  }

  return (
    <SelectorBaseList<SearchModalOption>
      focusedRowControl={{
        focusedRowIndex,
        setFocusedRowIndex,
      }}
      renderItem={renderItem}
      sections={sections}
      expandedItems={expandedItems}
      chainFilter={searchFilters.searchChainFilter}
      refetch={refetch}
      loading={loading}
      hasError={hasError}
      emptyElement={emptyElement}
      errorText={errorText}
      keyExtractor={key}
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
    />
  )
})

// oxlint-disable-next-line typescript/consistent-return
function key(item: SearchModalOption): string {
  switch (item.type) {
    case OnchainItemListOptionType.Pool:
      return `pool-${item.chainId}-${item.poolId}-${item.protocolVersion}-${item.hookAddress}-${item.feeTier}`
    case OnchainItemListOptionType.Token:
      return `token-${item.currencyInfo.currency.chainId}-${item.currencyInfo.currencyId}`
    case OnchainItemListOptionType.MultichainToken:
      return `multichain-${item.multichainResult.id}`
    case OnchainItemListOptionType.RwaCollection:
      return getRwaCollectionKey({ rwa: item.rwa })
    case OnchainItemListOptionType.WalletByAddress:
      return `wallet-${item.address}`
    case OnchainItemListOptionType.ENSAddress:
      return `ens-${item.address}`
    case OnchainItemListOptionType.Unitag:
      return `unitag-${item.address}`
  }
}
