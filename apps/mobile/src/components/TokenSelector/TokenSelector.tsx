import { Currency } from '@uniswap/sdk-core'
import { hasStringAsync } from 'expo-clipboard'
import React, { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PasteButton from 'src/components/buttons/PasteButton'
import { SearchContext } from 'src/components/explore/search/SearchContext'
import { SearchTextInput } from 'src/components/input/SearchTextInput'
import { useBottomSheetContext } from 'src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { NetworkFilter } from 'src/components/TokenSelector/NetworkFilter'
import { TokenSelectorEmptySearchList } from 'src/components/TokenSelector/TokenSelectorEmptySearchList'
import { TokenSelectorSearchResultsList } from 'src/components/TokenSelector/TokenSelectorSearchResultsList'
import { TokenSelectorSendList } from 'src/components/TokenSelector/TokenSelectorSendList'
import { TokenSelectorSwapInputList } from 'src/components/TokenSelector/TokenSelectorSwapInputList'
import { TokenSelectorSwapOutputList } from 'src/components/TokenSelector/TokenSelectorSwapOutputList'
import {
  SuggestedTokenSection,
  TokenSection,
  TokenSelectorFlow,
} from 'src/components/TokenSelector/types'
import Trace from 'src/components/Trace/Trace'
import { ElementName, ModalName, SectionName } from 'src/features/telemetry/constants'
import { getClipboard } from 'src/utils/clipboard'
import { Flex, useSporeColors } from 'ui/src'
import { useDebounce } from 'utilities/src/time/timing'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // used for Swap input. tokens with balances + popular
  BalancesAndPopular = 'balances-and-popular',

  // used for Swap output. suggested (common bases), favorites + popular (top tokens)
  SuggestedAndFavoritesAndPopular = 'suggested-and-favorites-and-popular',
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

function TokenSelectorContent({
  currencyField,
  flow,
  onSelectCurrency,
  chainId,
  onClose,
  variation,
}: TokenSelectorProps): JSX.Element {
  const { isSheetReady } = useBottomSheetContext()

  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter } = useFilterCallbacks(
    chainId ?? null,
    flow
  )
  const debouncedSearchFilter = useDebounce(searchFilter)

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

  // Log currency field only for Swap as for Transfer it's always input
  const currencyFieldName =
    flow === TokenSelectorFlow.Swap
      ? currencyField === CurrencyField.INPUT
        ? ElementName.TokenInputSelector
        : ElementName.TokenOutputSelector
      : undefined

  const onSelectCurrencyCallback = useCallback(
    (
      currencyInfo: CurrencyInfo,
      section: SuggestedTokenSection | TokenSection,
      index: number
    ): void => {
      const searchContext: SearchContext = {
        category: section.title,
        query: debouncedSearchFilter ?? undefined,
        position: index + 1,
        suggestionCount: section.data.length,
      }

      onSelectCurrency(currencyInfo.currency, currencyField, searchContext)
    },
    [currencyField, onSelectCurrency, debouncedSearchFilter]
  )

  const handlePaste = async (): Promise<void> => {
    const clipboardContent = await getClipboard()
    if (clipboardContent) {
      onChangeText(clipboardContent)
    }
  }

  const [searchInFocus, setSearchInFocus] = useState(false)

  return (
    <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
      <Flex grow gap="$spacing16" px="$spacing16">
        <SearchTextInput
          showCancelButton
          backgroundColor="$surface2"
          endAdornment={hasClipboardString ? <PasteButton inline onPress={handlePaste} /> : null}
          placeholder={t('Search tokens')}
          py="$spacing8"
          value={searchFilter ?? ''}
          onCancel={(): void => setSearchInFocus(false)}
          onChangeText={onChangeText}
          onFocus={(): void => setSearchInFocus(true)}
        />

        {isSheetReady && (
          <Flex grow>
            {searchInFocus && !searchFilter ? (
              <TokenSelectorEmptySearchList onSelectCurrency={onSelectCurrencyCallback} />
            ) : searchFilter ? (
              <TokenSelectorSearchResultsList
                chainFilter={chainFilter}
                debouncedSearchFilter={debouncedSearchFilter}
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
            {(!searchInFocus || searchFilter) && (
              <Flex position="absolute" right={0}>
                <NetworkFilter
                  includeAllNetworks
                  selectedChain={chainFilter}
                  onPressChain={onChangeChainFilter}
                />
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
    </Trace>
  )
}

function _TokenSelectorModal(props: TokenSelectorProps): JSX.Element {
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      renderBehindBottomInset
      backgroundColor={colors.surface1.get()}
      name={ModalName.TokenSelector}
      snapPoints={['65%', '100%']}
      onClose={props.onClose}>
      <TokenSelectorContent {...props} />
    </BottomSheetModal>
  )
}

export const TokenSelectorModal = memo(_TokenSelectorModal)
