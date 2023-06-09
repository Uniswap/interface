import { Currency } from '@uniswap/sdk-core'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Trace } from 'src/components/telemetry/Trace'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
import { TokenSearchResultList } from 'src/components/TokenSelector/TokenSearchResultList'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { ChainId } from 'wallet/src/constants/chains'

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
  currencyField: CurrencyField
  flow: TokenSelectorFlow
  chainId?: ChainId
  variation: TokenSelectorVariation
  onClose: () => void
  onSelectCurrency: (
    currency: Currency,
    currencyField: CurrencyField,
    context: SearchContext
  ) => void
}

function _TokenSelectorModal({
  currencyField,
  flow,
  onSelectCurrency,
  chainId,
  onClose,
  variation,
}: TokenSelectorProps): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter } = useFilterCallbacks(
    chainId ?? null,
    flow
  )

  const { t } = useTranslation()
  const theme = useAppTheme()

  // Log currency field only for Swap as for Transfer it's always input
  const currencyFieldName =
    flow === TokenSelectorFlow.Swap
      ? currencyField === CurrencyField.INPUT
        ? ElementName.TokenInputSelector
        : ElementName.TokenOutputSelector
      : undefined

  return (
    <BottomSheetModal
      fullScreen
      backgroundColor={theme.colors.background1}
      name={ModalName.TokenSelector}
      snapPoints={['95%']}
      onClose={onClose}>
      <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
        <Flex grow pb="spacing16" px="spacing16">
          <SearchBar
            autoFocus
            backgroundColor="background2"
            placeholder={t('Search tokens')}
            value={searchFilter ?? ''}
            onChangeText={onChangeText}
          />
          <TokenSearchResultList
            chainFilter={chainFilter}
            flow={flow}
            searchFilter={searchFilter}
            variation={variation}
            onChangeChainFilter={onChangeChainFilter}
            onSelectCurrency={(currency: Currency, context: SearchContext): void => {
              onSelectCurrency(currency, currencyField, context)
            }}
          />
        </Flex>
      </Trace>
    </BottomSheetModal>
  )
}

export const TokenSelectorModal = memo(_TokenSelectorModal)
