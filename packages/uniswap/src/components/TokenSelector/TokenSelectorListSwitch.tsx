import { memo } from 'react'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TokenSelectorEmptySearchList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorEmptySearchList'
import { TokenSelectorSearchResultsList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSearchResultsList'
import { TokenSelectorSendList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSendList'
import { TokenSelectorSwapList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSwapList'
import { TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

interface TokenSelectorListSwitchProps {
  searchInFocus: boolean
  searchFilter: string | null
  isTestnetModeEnabled: boolean
  variation: TokenSelectorVariation
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  input: TradeableAsset | undefined
  output: TradeableAsset | undefined
  renderedInModal: boolean
  // oxlint-disable-next-line max-params
  onSelectCurrency: (
    currencyInfo: CurrencyInfo,
    section: OnchainItemSection<TokenSelectorOption>,
    index: number,
  ) => void
  onSendEmptyActionPress: () => void
  debouncedParsedSearchFilter: string | null
  debouncedSearchFilter: string | null
  parsedChainFilter: UniverseChainId | null
}

export const TokenSelectorListSwitch = memo(function _TokenSelectorListSwitch({
  searchInFocus,
  searchFilter,
  isTestnetModeEnabled,
  variation,
  addresses,
  chainFilter,
  input,
  output,
  renderedInModal,
  onSelectCurrency,
  onSendEmptyActionPress,
  debouncedParsedSearchFilter,
  debouncedSearchFilter,
  parsedChainFilter,
}: TokenSelectorListSwitchProps): JSX.Element | null {
  if (searchInFocus && !searchFilter && !isTestnetModeEnabled) {
    return (
      <TokenSelectorEmptySearchList
        addresses={addresses}
        chainFilter={chainFilter}
        renderedInModal={renderedInModal}
        onSelectCurrency={onSelectCurrency}
      />
    )
  }

  if (searchFilter) {
    return (
      <TokenSelectorSearchResultsList
        addresses={addresses}
        chainFilter={chainFilter}
        debouncedParsedSearchFilter={debouncedParsedSearchFilter}
        debouncedSearchFilter={debouncedSearchFilter}
        isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
        parsedChainFilter={parsedChainFilter}
        searchFilter={searchFilter}
        input={input}
        renderedInModal={renderedInModal}
        onSelectCurrency={onSelectCurrency}
      />
    )
  }

  switch (variation) {
    case TokenSelectorVariation.BalancesOnly:
      return (
        <TokenSelectorSendList
          addresses={addresses}
          chainFilter={chainFilter}
          renderedInModal={renderedInModal}
          onEmptyActionPress={onSendEmptyActionPress}
          onSelectCurrency={onSelectCurrency}
        />
      )
    case TokenSelectorVariation.SwapInput:
      return (
        <TokenSelectorSwapList
          oppositeSelectedToken={output}
          addresses={addresses}
          chainFilter={chainFilter}
          renderedInModal={renderedInModal}
          onSelectCurrency={onSelectCurrency}
        />
      )
    case TokenSelectorVariation.SwapOutput:
      return (
        <TokenSelectorSwapList
          oppositeSelectedToken={input}
          addresses={addresses}
          chainFilter={chainFilter}
          renderedInModal={renderedInModal}
          onSelectCurrency={onSelectCurrency}
        />
      )
    default:
      return null
  }
})
