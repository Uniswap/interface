import { Currency } from '@uniswap/sdk-core'
import { hasStringAsync } from 'expo-clipboard'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import PasteButton from 'src/components/buttons/PasteButton'
import { SearchContext } from 'src/components/explore/search/SearchResultsSection'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { NetworkFilter } from 'src/components/TokenSelector/NetworkFilter'
import { SuggestedTokenSection, TokenSection } from 'src/components/TokenSelector/TokenSelectorList'
import { TokenSelectorSearchResultsList } from 'src/components/TokenSelector/TokenSelectorSearchResultsList'
import { TokenSelectorSendList } from 'src/components/TokenSelector/TokenSelectorSendList'
import { TokenSelectorSwapInputList } from 'src/components/TokenSelector/TokenSelectorSwapInputList'
import { TokenSelectorSwapOutputList } from 'src/components/TokenSelector/TokenSelectorSwapOutputList'
import Trace from 'src/components/Trace/Trace'
import { IS_IOS } from 'src/constants/globals'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { getClipboard } from 'src/utils/clipboard'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // used for Swap input. tokens with balances + popular
  BalancesAndPopular = 'balances-and-popular',

  // used for Swap output. suggested (common bases), favorites + popular (top tokens)
  SuggestedAndFavoritesAndPopular = 'suggested-and-favorites-and-popular',
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

  const [hasClipboardString, setHasClipboardString] = useState(false)

  // Check if user clipboard has any text to show paste button
  useEffect(() => {
    async function checkClipboard(): Promise<void> {
      const result = await hasStringAsync()
      setHasClipboardString(result)
    }

    checkClipboard().catch(() => undefined)
  }, [])

  const { t } = useTranslation()
  const theme = useAppTheme()

  // Log currency field only for Swap as for Transfer it's always input
  const currencyFieldName =
    flow === TokenSelectorFlow.Swap
      ? currencyField === CurrencyField.INPUT
        ? ElementName.TokenInputSelector
        : ElementName.TokenOutputSelector
      : undefined

  const onSelectCurrencyCallback = useCallback(
    (currency: Currency, section: SuggestedTokenSection | TokenSection, index: number): void => {
      const searchContext: SearchContext = {
        category: section.title,
        query: searchFilter ?? undefined,
        position: index + 1,
        suggestionCount: section.data.length,
      }

      onSelectCurrency(currency, currencyField, searchContext)
    },
    [currencyField, onSelectCurrency, searchFilter]
  )

  const handlePaste = async (): Promise<void> => {
    const clipboardContent = await getClipboard()
    if (clipboardContent) {
      onChangeText(clipboardContent)
    }
  }

  return (
    <BottomSheetModal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      backgroundColor={theme.colors.surface1}
      name={ModalName.TokenSelector}
      snapPoints={['65%', '100%']}
      onClose={onClose}>
      <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
        <Flex grow pb={IS_IOS ? 'spacing16' : 'none'} px="spacing16">
          <SearchTextInput
            backgroundColor="surface2"
            endAdornment={hasClipboardString ? <PasteButton onPress={handlePaste} /> : null}
            placeholder={t('Search tokens')}
            py="spacing8"
            value={searchFilter ?? ''}
            onChangeText={onChangeText}
          />
          <Box flexGrow={1}>
            {searchFilter ? (
              <TokenSelectorSearchResultsList
                chainFilter={chainFilter}
                isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
                searchFilter={searchFilter}
                onSelectCurrency={onSelectCurrencyCallback}
              />
            ) : variation === TokenSelectorVariation.BalancesOnly ? (
              <TokenSelectorSendList
                chainFilter={chainFilter}
                onClose={onClose}
                onSelectCurrency={onSelectCurrencyCallback}
              />
            ) : variation === TokenSelectorVariation.BalancesAndPopular ? (
              <TokenSelectorSwapInputList
                chainFilter={chainFilter}
                onSelectCurrency={onSelectCurrencyCallback}
              />
            ) : variation === TokenSelectorVariation.SuggestedAndFavoritesAndPopular ? (
              <TokenSelectorSwapOutputList
                chainFilter={chainFilter}
                onSelectCurrency={onSelectCurrencyCallback}
              />
            ) : null}
            <Box position="absolute" right={0}>
              <NetworkFilter
                includeAllNetworks
                selectedChain={chainFilter}
                onPressChain={onChangeChainFilter}
              />
            </Box>
          </Box>
        </Flex>
      </Trace>
    </BottomSheetModal>
  )
}

export const TokenSelectorModal = memo(_TokenSelectorModal)
