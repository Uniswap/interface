import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { isHoverable } from '@universe/environment'
import { memo, useCallback, useState, type ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { AuctionOptionItem } from 'uniswap/src/components/lists/items/auctions/AuctionOptionItem'
import { EarnVaultOptionItem } from 'uniswap/src/components/lists/items/earn/EarnVaultOptionItem'
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
import type { IssuerToken } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { useDelayedMenuClose } from 'uniswap/src/features/search/SearchModal/hooks/useDelayedMenuClose'
import { RwaCollectionItem } from 'uniswap/src/features/search/SearchModal/RwaCollectionItem'
import { RwaIssuerRow } from 'uniswap/src/features/search/SearchModal/RwaIssuerRow'
import { getRwaCollectionKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { getRwaIssuerCurrencyInfo } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIssuerCurrencyInfos'
import { TokenRowContextMenuButton } from 'uniswap/src/features/search/SearchModal/TokenRowContextMenuButton'
import {
  searchModalOptionKey,
  tdpChainFilterForTokenRow,
  toggleKeyInList,
} from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { tdpChainSelectionFromFilter } from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

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

/** `rwaIssuerChild` is the RwaCollection's expanded issuer sub-rows (the collection's child rows) — distinguished
 *  from `token` because those rows sit deeper in the expandable shell's nesting and need a different offset. */
export type SearchModalRowVariant = 'token' | 'rwaIssuerChild'

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
  contentContainerStyle?: StyleProp<ViewStyle>
  rowWrapper?: (props: {
    element: JSX.Element
    currencyInfo: CurrencyInfo
    variant: SearchModalRowVariant
  }) => JSX.Element
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
  rowWrapper,
  rwaIssuerCurrencyInfos,
}: SearchModalListProps): JSX.Element {
  const {
    navigateToTokenDetails,
    navigateToExternalProfile,
    navigateToPoolDetails,
    navigateToEarnVault,
    navigateToAuction,
    getTokenDetailsUrl,
    getPoolDetailsUrl,
    getExternalProfileUrl,
  } = useUniswapContext()
  const { registerSearchItem } = useAddToSearchHistory()
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

  const renderItem = ({ item, section, rowIndex, index, expanded }: ItemRowInfo<SearchModalOption>): JSX.Element => {
    switch (item.type) {
      case OnchainItemListOptionType.Pool: {
        const recordPoolSelection = (): void => {
          registerSearchItem(item)
          sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters })
        }
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
            modifierPressHref={getPoolDetailsUrl?.({ poolId: item.poolId, chainId: item.chainId })}
            onPress={() => {
              recordPoolSelection()
              navigateToPoolDetails({ poolId: item.poolId, chainId: item.chainId })
              onSelect?.()
            }}
            onModifierPress={recordPoolSelection}
          />
        )
      }
      case OnchainItemListOptionType.Token: {
        const tdpChain = tdpChainFilterForTokenRow({
          searchChainFilter: searchFilters.searchChainFilter,
          rowChainId: item.currencyInfo.currency.chainId,
          searchQuery: searchFilters.query,
        })
        const recordTokenSelection = (): void => {
          registerSearchItem(item, { tdpChainFilter: tdpChain })
          sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters })
        }
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
            modifierPressHref={getTokenDetailsUrl?.(
              item.currencyInfo.currencyId,
              tdpChainSelectionFromFilter(tdpChain),
            )}
            onPress={() => {
              recordTokenSelection()
              navigateToTokenDetails(item.currencyInfo.currencyId, tdpChainSelectionFromFilter(tdpChain))
              onSelect?.()
            }}
            onModifierPress={recordTokenSelection}
          />
        )
        return rowWrapper
          ? rowWrapper({ element: tokenElement, currencyInfo: item.currencyInfo, variant: 'token' })
          : tokenElement
      }
      case OnchainItemListOptionType.MultichainToken: {
        const multichainTdpChain = tdpChainFilterForTokenRow({
          searchChainFilter: searchFilters.searchChainFilter,
          rowChainId: item.primaryCurrencyInfo.currency.chainId,
          explicitTdpChain: item.tdpChainFilter,
          searchQuery: searchFilters.query,
          allowAggregate: true,
        })
        const recordMultichainSelection = (): void => {
          registerSearchItem(item, { tdpChainFilter: multichainTdpChain })
          sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters })
        }
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
            modifierPressHref={getTokenDetailsUrl?.(
              item.primaryCurrencyInfo.currencyId,
              tdpChainSelectionFromFilter(multichainTdpChain),
            )}
            onPress={() => {
              recordMultichainSelection()
              navigateToTokenDetails(
                item.primaryCurrencyInfo.currencyId,
                tdpChainSelectionFromFilter(multichainTdpChain),
              )
              onSelect?.()
            }}
            onModifierPress={recordMultichainSelection}
          />
        )
        return rowWrapper
          ? rowWrapper({ element: multichainElement, currencyInfo: item.primaryCurrencyInfo, variant: 'token' })
          : multichainElement
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
            onToggle={() => toggleExpanded(getRwaCollectionKey({ rwa }))}
            onSelect={onSelect}
          />
        )
      }
      case OnchainItemListOptionType.WalletByAddress: {
        const recordWalletByAddressSelection = (): void => {
          registerSearchItem(item)
          sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters })
        }
        return (
          <WalletByAddressOptionItem
            walletByAddressOption={item}
            modifierPressHref={getExternalProfileUrl?.({ address: item.address })}
            onPress={() => {
              recordWalletByAddressSelection()
              navigateToExternalProfile({ address: item.address })
              onSelect?.()
            }}
            onModifierPress={recordWalletByAddressSelection}
          />
        )
      }
      case OnchainItemListOptionType.ENSAddress: {
        const recordEnsSelection = (): void => {
          registerSearchItem(item)
          sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters })
        }
        return (
          <ENSAddressOptionItem
            ensAddressOption={item}
            modifierPressHref={getExternalProfileUrl?.({ address: item.address })}
            onPress={() => {
              recordEnsSelection()
              navigateToExternalProfile({ address: item.address })
              onSelect?.()
            }}
            onModifierPress={recordEnsSelection}
          />
        )
      }
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
            onPress={() => {
              navigateToEarnVault?.({ analyticsEntryPoint: 'search', vault: item.vault, position: item.position })
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
      case OnchainItemListOptionType.Unitag: {
        const recordUnitagSelection = (): void => {
          registerSearchItem(item)
          sendSearchOptionItemClickedAnalytics({ item, section, sectionIndex: index, rowIndex, searchFilters })
        }
        return (
          <UnitagOptionItem
            unitagOption={item}
            modifierPressHref={getExternalProfileUrl?.({ address: item.address })}
            onPress={() => {
              recordUnitagSelection()
              navigateToExternalProfile({ address: item.address })
              onSelect?.()
            }}
            onModifierPress={recordUnitagSelection}
          />
        )
      }
      case OnchainItemListOptionType.Auction:
        return (
          <AuctionOptionItem
            option={item}
            focusedRowControl={{
              rowIndex,
              setFocusedRowIndex,
              focusedRowIndex,
            }}
            onPress={() => {
              registerSearchItem(item)
              navigateToAuction?.({ auctionAddress: item.auctionAddress, chainId: item.chainId })

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
      default:
        return <></>
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
      keyExtractor={searchModalOptionKey}
      renderedInModal={renderedInModal}
      contentContainerStyle={contentContainerStyle}
    />
  )
})
