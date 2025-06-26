import { memo, useEffect, useState } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { iconSizes } from 'ui/src/theme'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { NFTCollectionOptionItem } from 'uniswap/src/components/lists/items/nfts/NFTCollectionOptionItem'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import { TokenContextMenuVariant, TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import {
  TokenContextMenuAction,
  TokenOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { OnchainItemListOptionType, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { ENSAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/ENSAddressOptionItem'
import { UnitagOptionItem } from 'uniswap/src/components/lists/items/wallets/UnitagOptionItem'
import { WalletByAddressOptionItem } from 'uniswap/src/components/lists/items/wallets/WalletByAddressOptionItem'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import { isHoverable, isWeb } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import noop from 'utilities/src/react/noop'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export interface SearchModalListProps {
  sections?: OnchainItemSection<SearchModalOption>[]
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  onSelect?: () => void
  searchFilters: SearchFilterContext
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
}: SearchModalListProps): JSX.Element {
  const { navigateToTokenDetails, navigateToExternalProfile, navigateToNftCollection } = useUniswapContext()
  const { registerSearchItem } = useAddToSearchHistory()

  const { value: isContextMenuOpen, setFalse: closeContextMenu, toggle: toggleContextMenu } = useBooleanState(false)

  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>(1) // set to 1st item hovered on first open

  // to handle closing the left-click '...' context menu when the focused row changes
  const previousFocusedRowIndex = usePrevious(focusedRowIndex)
  useEffect(() => {
    if (isWeb && previousFocusedRowIndex !== focusedRowIndex) {
      closeContextMenu()
    }
  }, [previousFocusedRowIndex, focusedRowIndex, closeContextMenu])

  // eslint-disable-next-line consistent-return
  const renderItem = ({ item, section, rowIndex }: ItemRowInfo<SearchModalOption>): JSX.Element => {
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
            onPress={() => {
              registerSearchItem(item)

              // TODO: navigate to pool details

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
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
                <TouchableArea
                  borderWidth={1}
                  hoverStyle={{
                    borderColor: '$surface3Hovered',
                  }}
                  borderRadius="$rounded12"
                  onPress={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleContextMenu()
                  }}
                >
                  <TokenOptionItemContextMenu
                    actions={[
                      TokenContextMenuAction.CopyAddress,
                      ...(isWeb ? [] : [TokenContextMenuAction.Favorite]),
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
                </TouchableArea>
              ) : undefined
            }
            onPress={() => {
              registerSearchItem(item)

              navigateToTokenDetails(item.currencyInfo.currencyId)

              sendSearchOptionItemClickedAnalytics({
                item,
                section,
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
