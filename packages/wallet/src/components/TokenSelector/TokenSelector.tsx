import { Currency } from '@uniswap/sdk-core'
import { hasStringAsync } from 'expo-clipboard'
import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { Flex, useSporeColors } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { useDebounce } from 'utilities/src/time/timing'
import PasteButton from 'wallet/src/components/buttons/PasteButton'
import { useBottomSheetContext } from 'wallet/src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { NetworkFilter } from 'wallet/src/components/network/NetworkFilter'
import { useFilterCallbacks } from 'wallet/src/components/TokenSelector/hooks'
import { TokenSelectorEmptySearchList } from 'wallet/src/components/TokenSelector/TokenSelectorEmptySearchList'
import { TokenSelectorSearchResultsList } from 'wallet/src/components/TokenSelector/TokenSelectorSearchResultsList'
import { TokenSelectorSendList } from 'wallet/src/components/TokenSelector/TokenSelectorSendList'
import { TokenSelectorSwapInputList } from 'wallet/src/components/TokenSelector/TokenSelectorSwapInputList'
import { TokenSelectorSwapOutputList } from 'wallet/src/components/TokenSelector/TokenSelectorSwapOutputList'
import { SuggestedTokenSection, TokenSection } from 'wallet/src/components/TokenSelector/types'
import { ChainId } from 'wallet/src/constants/chains'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { SearchTextInput } from 'wallet/src/features/search/SearchTextInput'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { ElementName, ModalName, SectionName } from 'wallet/src/telemetry/constants'
import { getClipboard } from 'wallet/src/utils/clipboard'

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
  onSendEmptyActionPress: () => void
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
  onSendEmptyActionPress,
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
                onEmptyActionPress={onSendEmptyActionPress}
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

  useEffect(() => {
    // Dismiss native keyboard when opening modal in case it was opened by the current screen.
    Keyboard.dismiss()
  }, [])

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
