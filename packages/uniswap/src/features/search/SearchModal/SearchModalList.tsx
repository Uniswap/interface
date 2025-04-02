import { memo, useCallback } from 'react'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ItemRowInfo } from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import { TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { SearchModalItemTypes, isPoolOption } from 'uniswap/src/components/lists/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { logger } from 'utilities/src/logger/logger'

interface SearchModalListProps {
  onSelect: (item: SearchModalItemTypes) => void
  sections?: TokenSection<SearchModalItemTypes>[]
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

  const renderItem = useCallback(
    ({ item, section, index }: ItemRowInfo<SearchModalItemTypes>) => {
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
    },
    [onSelect, registerSearch],
  )

  return (
    <SelectorBaseList<SearchModalItemTypes>
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
