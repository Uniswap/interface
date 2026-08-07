import { memo } from 'react'
import { type PortfolioBalancesResult } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { OnSelectCurrency, OnSelectRwaToken, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { EmptySearchListV2 } from 'uniswap/src/components/TokenSelectorV2/lists/EmptySearchListV2'
import { SearchResultsListV2 } from 'uniswap/src/components/TokenSelectorV2/lists/SearchResultsListV2'
import { SendListV2 } from 'uniswap/src/components/TokenSelectorV2/lists/SendListV2'
import { SwapListV2 } from 'uniswap/src/components/TokenSelectorV2/lists/SwapListV2'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

interface TokenSelectorV2ListSwitchProps {
  searchInFocus: boolean
  searchFilter: string | null
  isTestnetModeEnabled: boolean
  variation: TokenSelectorVariation
  addresses: AddressGroup
  chainFilter: UniverseChainId | null
  chainIds: UniverseChainId[]
  input: TradeableAsset | undefined
  output: TradeableAsset | undefined
  renderedInModal: boolean
  includeYourTokens: boolean
  portfolioData: PortfolioBalancesResult
  onSelectCurrency: OnSelectCurrency
  onSendEmptyActionPress: () => void
  debouncedParsedSearchFilter: string | null
  debouncedSearchFilter: string | null
  parsedChainFilter: UniverseChainId | null
  onSelectRwaToken?: OnSelectRwaToken
}

/** V2 list dispatch: mirrors the legacy TokenSelectorListSwitch state machine with V2 lists. */
export const TokenSelectorV2ListSwitch = memo(function TokenSelectorV2ListSwitch({
  searchInFocus,
  searchFilter,
  isTestnetModeEnabled,
  variation,
  addresses,
  chainFilter,
  chainIds,
  input,
  output,
  renderedInModal,
  includeYourTokens,
  portfolioData,
  onSelectCurrency,
  onSendEmptyActionPress,
  debouncedParsedSearchFilter,
  debouncedSearchFilter,
  parsedChainFilter,
  onSelectRwaToken,
}: TokenSelectorV2ListSwitchProps): JSX.Element | null {
  if (searchInFocus && !searchFilter && !isTestnetModeEnabled) {
    return (
      <EmptySearchListV2
        addresses={addresses}
        chainFilter={chainFilter}
        chainIds={chainIds}
        variation={variation}
        renderedInModal={renderedInModal}
        onSelectCurrency={onSelectCurrency}
      />
    )
  }

  if (searchFilter) {
    return (
      <SearchResultsListV2
        addresses={addresses}
        chainFilter={chainFilter}
        chainIds={chainIds}
        debouncedParsedSearchFilter={debouncedParsedSearchFilter}
        debouncedSearchFilter={debouncedSearchFilter}
        isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
        parsedChainFilter={parsedChainFilter}
        searchFilter={searchFilter}
        input={input}
        variation={variation}
        renderedInModal={renderedInModal}
        onSelectCurrency={onSelectCurrency}
      />
    )
  }

  switch (variation) {
    case TokenSelectorVariation.BalancesOnly:
      return (
        <SendListV2
          chainFilter={chainFilter}
          chainIds={chainIds}
          portfolioData={portfolioData}
          renderedInModal={renderedInModal}
          onEmptyActionPress={onSendEmptyActionPress}
          onSelectCurrency={onSelectCurrency}
        />
      )
    case TokenSelectorVariation.SwapInput:
      return (
        <SwapListV2
          oppositeSelectedToken={output}
          chainFilter={chainFilter}
          chainIds={chainIds}
          includeYourTokens={includeYourTokens}
          portfolioData={portfolioData}
          variation={variation}
          renderedInModal={renderedInModal}
          onSelectCurrency={onSelectCurrency}
          onSelectRwaToken={onSelectRwaToken}
        />
      )
    case TokenSelectorVariation.SwapOutput:
      return (
        <SwapListV2
          oppositeSelectedToken={input}
          chainFilter={chainFilter}
          chainIds={chainIds}
          includeYourTokens={includeYourTokens}
          portfolioData={portfolioData}
          variation={variation}
          renderedInModal={renderedInModal}
          onSelectCurrency={onSelectCurrency}
          onSelectRwaToken={onSelectRwaToken}
        />
      )
    default:
      return null
  }
})
