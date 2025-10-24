import { ContentStyle } from '@shopify/flash-list'
import { memo, useEffect, useState } from 'react'
import { Flex, styled, TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { iconSizes } from 'ui/src/theme'
import { NFTCollectionOptionItem } from 'uniswap/src/components/lists/items/nfts/NFTCollectionOptionItem'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import {
  PoolContextMenuAction,
  PoolOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/pools/PoolOptionItemContextMenu'
import { TokenContextMenuVariant, TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import {
  TokenContextMenuAction,
  TokenOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { ENSAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/ENSAddressOptionItem'
import { UnitagOptionItem } from 'uniswap/src/components/lists/items/wallets/UnitagOptionItem'
import { WalletByAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletByAddressOptionItem'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { isHoverable, isWebPlatform } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const OptionItemMoreButton = styled(TouchableArea, {
  borderWidth: 1,
  borderRadius: '$rounded12',
  hoverStyle: {
    borderColor: '$surface3Hovered',
  },
})

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
}

export const SearchModalList = memo(function _SearchModalList({
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
}: SearchModalListProps): JSX.Element {
  const { navigateToTokenDetails, navigateToExternalProfile, navigateToNftCollection, navigateToPoolDetails } =
    useUniswapContext()
  const { registerSearchItem } = useAddToSearchHistory()

  const { value: isContextMenuOpen, setFalse: closeContextMenu, toggle: toggleContextMenu } = useBooleanState(false)

  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>(1) // set to 1st item hovered on first open

  // to handle closing the left-click '...' context menu when the focused row changes
  const previousFocusedRowIndex = usePrevious(focusedRowIndex)
  useEffect(() => {
    if (isWebPlatform && previousFocusedRowIndex !== focusedRowIndex) {
      closeContextMenu()
    }
  }, [previousFocusedRowIndex, focusedRowIndex, closeContextMenu])

  // eslint-disable-next-line consistent-return
  const renderItem = ({ item, section, rowIndex, index }: ItemRowInfo<SearchModalOption>): JSX.Element => {
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
              isHoverable && rowIndex === focusedRowIndex ? (
                <OptionItemMoreButton
                  onPress={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleContextMenu()
                  }}
                >
                  <PoolOptionItemContextMenu
                    actions={[PoolContextMenuAction.CopyAddress, PoolContextMenuAction.Share]}
                    isOpen={previousFocusedRowIndex === focusedRowIndex && isContextMenuOpen}
                    openMenu={noop}
                    closeMenu={noop}
                    poolId={item.poolId}
                    chainId={item.chainId}
                    protocolVersion={item.protocolVersion}
                    triggerMode={ContextMenuTriggerMode.Primary}
                  >
                    <Flex p="$spacing6">
                      <MoreHorizontal size={iconSizes.icon16} color="$neutral2" />
                    </Flex>
                  </PoolOptionItemContextMenu>
                </OptionItemMoreButton>
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
      case OnchainItemListOptionType.Token:
        return (
          <TokenOptionItem
            showTokenAddress
            option={item}
            contextMenuVariant={TokenContextMenuVariant.Search}
            focusedRowControl={{
              focusedRowIndex,
              setFocusedRowIndex,
              rowIndex,
            }}
            rightElement={
              isHoverable && rowIndex === focusedRowIndex ? (
                <OptionItemMoreButton
                  onPress={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleContextMenu()
                  }}
                >
                  <TokenOptionItemContextMenu
                    actions={[
                      TokenContextMenuAction.CopyAddress,
                      ...(isWebPlatform ? [] : [TokenContextMenuAction.Favorite]),
                      TokenContextMenuAction.Swap,
                      TokenContextMenuAction.Send,
                      TokenContextMenuAction.Receive,
                      TokenContextMenuAction.Share,
                    ]}
                    triggerMode={ContextMenuTriggerMode.Primary}
                    currency={item.currencyInfo.currency}
                    isOpen={previousFocusedRowIndex === focusedRowIndex && isContextMenuOpen}
                    openMenu={noop}
                    closeMenu={noop}
                  >
                    <Flex p="$spacing6">
                      <MoreHorizontal size={iconSizes.icon16} color="$neutral2" />
                    </Flex>
                  </TokenOptionItemContextMenu>
                </OptionItemMoreButton>
              ) : undefined
            }
            onPress={() => {
              registerSearchItem(item)

              navigateToTokenDetails(item.currencyInfo.currencyId)

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
      case OnchainItemListOptionType.NFTCollection:
        return (
          <NFTCollectionOptionItem
            collectionOption={item}
            onPress={() => {
              const { address, chainId } = item

              navigateToNftCollection({ collectionAddress: address, chainId })

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

// eslint-disable-next-line consistent-return
function key(item: SearchModalOption): string {
  switch (item.type) {
    case OnchainItemListOptionType.Pool:
      return `pool-${item.chainId}-${item.poolId}-${item.protocolVersion}-${item.hookAddress}-${item.feeTier}`
    case OnchainItemListOptionType.Token:
      return `token-${item.currencyInfo.currency.chainId}-${item.currencyInfo.currencyId}`
    case OnchainItemListOptionType.WalletByAddress:
      return `wallet-${item.address}`
    case OnchainItemListOptionType.ENSAddress:
      return `ens-${item.address}`
    case OnchainItemListOptionType.Unitag:
      return `unitag-${item.address}`
    case OnchainItemListOptionType.NFTCollection:
      return `nft-${item.chainId}-${item.address}`
  }
}
