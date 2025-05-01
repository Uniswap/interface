import { memo, useEffect, useState } from 'react'
import { Flex, TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { iconSizes } from 'ui/src/theme'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { OnchainItemSection } from 'uniswap/src/components/TokenSelector/types'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import { TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { TokenOptionItemContextMenu } from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { SearchModalItemTypes, isPoolOption } from 'uniswap/src/components/lists/items/types'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'
import { isHoverable, isWeb } from 'utilities/src/platform'
import { usePrevious } from 'utilities/src/react/hooks'
import noop from 'utilities/src/react/noop'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

interface SearchModalListProps {
  onSelect: (item: SearchModalItemTypes) => void
  sections?: OnchainItemSection<SearchModalItemTypes>[]
  chainFilter?: UniverseChainId | null
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
}

function _SearchModalList({
  onSelect,
  sections,
  chainFilter,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
}: SearchModalListProps): JSX.Element {
  const { registerSearch } = useAddToSearchHistory()

  const { value: isContextMenuOpen, setFalse: closeContextMenu, toggle: toggleContextMenu } = useBooleanState(false)

  const [focusedRowIndex, setFocusedRowIndex] = useState<number | undefined>(1) // set to 1st item hovered on first open

  // to handle closing the left-click '...' context menu when the focused row changes
  const previousFocusedRowIndex = usePrevious(focusedRowIndex)
  useEffect(() => {
    if (isWeb && previousFocusedRowIndex !== focusedRowIndex) {
      closeContextMenu()
    }
  }, [previousFocusedRowIndex, focusedRowIndex, closeContextMenu])

  const renderItem = ({ item, section, index, rowIndex }: ItemRowInfo<SearchModalItemTypes>): JSX.Element => {
    if (isPoolOption(item)) {
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
            // TODO(WEB-6810): add pool to recent searches
            // registerSearch(currencyInfo)

            onSelect(item)

            // TODO(WEB-6771): add analytics event when pool option is selected -- see InterfaceEventName.NAVBAR_RESULT_SELECTED
            logger.debug(
              'SearchModalList',
              'renderItem',
              'logging analytics event for pool option item',
              item,
              section,
              index,
            )
          }}
        />
      )
    }

    return (
      <TokenOptionItem
        showTokenAddress
        option={item}
        focusedRowControl={{
          focusedRowIndex,
          setFocusedRowIndex,
          rowIndex,
        }}
        rightElement={
          isHoverable && rowIndex === focusedRowIndex ? (
            <TouchableArea
              hoverStyle={{
                borderColor: '$surface3Hovered',
                borderWidth: 1,
              }}
              borderRadius="$rounded12"
              onPress={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleContextMenu()
              }}
            >
              <TokenOptionItemContextMenu
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
          registerSearch(item.currencyInfo)

          onSelect(item)

          // TODO(WEB-6771): add analytics event when token option is selected -- see InterfaceEventName.NAVBAR_RESULT_SELECTED
          logger.debug(
            'SearchModalList',
            'renderItem',
            'logging analytics event for token option item',
            item,
            section,
            index,
          )
        }}
      />
    )
  }

  return (
    <SelectorBaseList<SearchModalItemTypes>
      focusedRowControl={{
        focusedRowIndex,
        setFocusedRowIndex,
      }}
      renderItem={renderItem}
      sections={sections}
      chainFilter={chainFilter}
      refetch={refetch}
      loading={loading}
      hasError={hasError}
      emptyElement={emptyElement}
      errorText={errorText}
      keyExtractor={key}
    />
  )
}

function key(item: SearchModalItemTypes): string {
  if (isPoolOption(item)) {
    return `pool-${item.chainId}-${item.poolId}-${item.protocolVersion}-${item.hookAddress}-${item.feeTier}`
  }
  return `token-${item.currencyInfo.currency.chainId}-${item.currencyInfo.currencyId}`
}

export const SearchModalList = memo(_SearchModalList)
