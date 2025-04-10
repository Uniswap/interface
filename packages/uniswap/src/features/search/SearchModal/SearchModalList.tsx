import { memo, useCallback } from 'react'
import { TokenOptionItem } from 'uniswap/src/components/TokenSelector/items/TokenOptionItem'
import { OnSelectCurrency, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ItemRowInfo } from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import { SearchModalItemTypes, TokenOption } from 'uniswap/src/components/lists/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { CurrencyId } from 'uniswap/src/types/currency'

const TokenOptionItemWrapper = memo(function _TokenOptionItemWrapper({
  tokenOption,
  onSelectCurrency,
  section,
  index,
  showWarnings,
  showTokenAddress,
  isKeyboardOpen,
}: {
  tokenOption: TokenOption
  section: TokenSection<TokenOption>
  index: number
  showWarnings: boolean
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const onPress = useCallback(
    () => onSelectCurrency(tokenOption.currencyInfo, section, index),
    [index, onSelectCurrency, section, tokenOption.currencyInfo],
  )

  const { tokenWarningDismissed } = useDismissedTokenWarnings(tokenOption.currencyInfo.currency)

  return (
    <TokenOptionItem
      isKeyboardOpen={isKeyboardOpen}
      option={tokenOption}
      showTokenAddress={showTokenAddress}
      showWarnings={showWarnings}
      tokenWarningDismissed={tokenWarningDismissed}
      quantity={null}
      balance="" // change tokenoptionitem to allow undefined balance/quantity
      onPress={onPress}
    />
  )
})

interface SearchModalListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSection<SearchModalItemTypes>[]
  chainFilter?: UniverseChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
}

function _SearchModalList({
  onSelectCurrency,
  sections,
  chainFilter,
  showTokenWarnings,
  isKeyboardOpen,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
}: SearchModalListProps): JSX.Element {
  const renderItem = useCallback(
    ({ item, section, index }: ItemRowInfo<SearchModalItemTypes>) => {
      // if (isTokenItem(item)) {
      //   // return token option item wrapper
      // } else if (isNFTItem(item)) {
      //   // return nft item wrapper
      // } else if (isWalletItem(item)) {
      //   // return wallet item wrapper
      // }
      return (
        <TokenOptionItemWrapper
          index={index}
          isKeyboardOpen={isKeyboardOpen}
          section={section}
          showTokenAddress={showTokenAddress}
          showWarnings={showTokenWarnings}
          tokenOption={item}
          onSelectCurrency={onSelectCurrency}
        />
      )
    },
    [isKeyboardOpen, onSelectCurrency, showTokenAddress, showTokenWarnings],
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

function key(item: SearchModalItemTypes): CurrencyId {
  return item.currencyInfo.currencyId
}

export const SearchModalList = memo(_SearchModalList)
