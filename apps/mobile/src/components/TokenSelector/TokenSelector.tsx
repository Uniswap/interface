import { Currency } from '@uniswap/sdk-core'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { AnimatedFlex } from 'src/components/layout'
import { Trace } from 'src/components/telemetry/Trace'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
import { TokenSearchResultList } from 'src/components/TokenSelector/TokenSearchResultList'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // used for Swap input. tokens with balances + popular
  BalancesAndPopular = 'balances-and-popular',

  // used for Swap output. tokens with balances, favorites, common + popular
  SuggestedAndPopular = 'suggested-and-popular',
}

export enum TokenSelectorFlow {
  Swap,
  Transfer,
}

export function flowToModalName(flow: TokenSelectorFlow): ModalName | undefined {
  switch (flow) {
    case TokenSelectorFlow.Swap:
      return ModalName.Swap
    case TokenSelectorFlow.Transfer:
      return ModalName.Send
    default:
      return undefined
  }
}

interface TokenSelectorProps {
  currencyField?: CurrencyField
  flow: TokenSelectorFlow
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  variation: TokenSelectorVariation
  onBack: () => void
  onSelectCurrency: (currency: Currency, context: SearchContext) => void
}

function _TokenSelector({
  currencyField,
  flow,
  onSelectCurrency,
  otherCurrency,
  onBack,
  variation,
}: TokenSelectorProps): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter } = useFilterCallbacks(
    otherCurrency?.chainId ?? null,
    flow
  )

  const { t } = useTranslation()

  // Handle logging if this is for input or output
  const currencyFieldName = currencyField
    ? currencyField === CurrencyField.INPUT
      ? ElementName.TokenInputSelector
      : ElementName.TokenOutputSelector
    : undefined

  return (
    <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
      <AnimatedFlex
        entering={FadeIn}
        exiting={FadeOut}
        gap="spacing12"
        overflow="hidden"
        px="spacing16"
        width="100%">
        <SearchBar
          autoFocus
          backgroundColor="background2"
          placeholder={t('Search tokens')}
          value={searchFilter ?? ''}
          onBack={onBack}
          onChangeText={onChangeText}
        />
        <TokenSearchResultList
          chainFilter={chainFilter}
          flow={flow}
          searchFilter={searchFilter}
          variation={variation}
          onChangeChainFilter={onChangeChainFilter}
          onSelectCurrency={onSelectCurrency}
        />
      </AnimatedFlex>
    </Trace>
  )
}

export const TokenSelector = memo(_TokenSelector)
