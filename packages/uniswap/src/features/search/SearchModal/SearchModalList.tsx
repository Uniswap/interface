import { memo, useCallback } from 'react'
import { OnSelectCurrency, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ItemRowInfo } from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import { PoolOptionItem } from 'uniswap/src/components/lists/items/pools/PoolOptionItem'
import { TokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { SearchModalItemTypes, isPoolOption } from 'uniswap/src/components/lists/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface SearchModalListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSection<SearchModalItemTypes>[]
  chainFilter?: UniverseChainId | null
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
}

function _SearchModalList({
  sections,
  chainFilter,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
}: SearchModalListProps): JSX.Element {
  const renderItem = useCallback(({ item, section, index }: ItemRowInfo<SearchModalItemTypes>) => {
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
            // eslint-disable-next-line no-console
            console.log('pool option item', item, section, index)
          }}
        />
      )
    }

    return (
      <TokenOptionItem
        showTokenAddress
        option={item}
        onPress={() =>
          // eslint-disable-next-line no-console
          console.log('token option item', item, section, index)
        }
      />
    )
  }, [])

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
