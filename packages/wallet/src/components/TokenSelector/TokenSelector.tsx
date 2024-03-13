import { Currency } from '@uniswap/sdk-core'
import { hasStringAsync } from 'expo-clipboard'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { Flex, isWeb, useSporeColors } from 'ui/src'
import { zIndices } from 'ui/src/theme'
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
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
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

export interface TokenSelectorProps {
  currencyField: CurrencyField
  flow: TokenSelectorFlow
  chainId?: ChainId
  isSurfaceReady?: boolean
  onClose: () => void
  onSelectCurrency: (
    currency: Currency,
    currencyField: CurrencyField,
    context: SearchContext
  ) => void
  variation: TokenSelectorVariation
}

function TokenSelectorContent({
  currencyField,
  flow,
  onSelectCurrency,
  chainId,
  onClose,
  variation,
  isSurfaceReady = true,
}: TokenSelectorProps): JSX.Element {
  const { navigateToBuyOrReceiveWithEmptyWallet } = useWalletNavigation()

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

  const onSendEmptyActionPress = useCallback(() => {
    onClose()
    navigateToBuyOrReceiveWithEmptyWallet()
  }, [navigateToBuyOrReceiveWithEmptyWallet, onClose])

  function onCancel(): void {
    setSearchInFocus(false)
  }
  function onFocus(): void {
    if (!isWeb) {
      setSearchInFocus(true)
    }
  }

  const tokenSelector = useMemo(() => {
    if (searchInFocus && !searchFilter) {
      return <TokenSelectorEmptySearchList onSelectCurrency={onSelectCurrencyCallback} />
    }

    if (searchFilter) {
      return (
        <TokenSelectorSearchResultsList
          chainFilter={chainFilter}
          debouncedSearchFilter={debouncedSearchFilter}
          isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
          searchFilter={searchFilter}
          onSelectCurrency={onSelectCurrencyCallback}
        />
      )
    }

    switch (variation) {
      case TokenSelectorVariation.BalancesOnly:
        return (
          <TokenSelectorSendList
            chainFilter={chainFilter}
            onEmptyActionPress={onSendEmptyActionPress}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      case TokenSelectorVariation.BalancesAndPopular:
        return (
          <TokenSelectorSwapInputList
            chainFilter={chainFilter}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      case TokenSelectorVariation.SuggestedAndFavoritesAndPopular:
        return (
          <TokenSelectorSwapOutputList
            chainFilter={chainFilter}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
    }
  }, [
    searchInFocus,
    searchFilter,
    variation,
    onSelectCurrencyCallback,
    chainFilter,
    debouncedSearchFilter,
    onSendEmptyActionPress,
  ])

  return (
    <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
      <Flex grow gap={isWeb ? '$spacing4' : '$spacing16'} px="$spacing16">
        <Flex
          borderBottomColor={isWeb ? '$surface3' : undefined}
          borderBottomWidth={isWeb ? '$spacing1' : undefined}
          py="$spacing8">
          <SearchTextInput
            backgroundColor={isWeb ? '$surface1' : '$surface2'}
            endAdornment={hasClipboardString ? <PasteButton inline onPress={handlePaste} /> : null}
            placeholder={t('tokens.selector.search.placeholder')}
            px={isWeb ? '$none' : '$spacing16'}
            py="$none"
            value={searchFilter ?? ''}
            onCancel={isWeb ? undefined : onCancel}
            onChangeText={onChangeText}
            onClose={isWeb ? onClose : undefined}
            onFocus={isWeb ? undefined : onFocus}
          />
        </Flex>
        {isSurfaceReady && (
          <Flex grow>
            {tokenSelector}

            {(!searchInFocus || searchFilter) && (
              <Flex position="absolute" right={0} zIndex={zIndices.fixed}>
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

function TokenSelectorModalContent(props: TokenSelectorProps): JSX.Element {
  const { isSheetReady } = useBottomSheetContext()

  return <TokenSelectorContent {...props} isSurfaceReady={isSheetReady} />
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
      <TokenSelectorModalContent {...props} />
    </BottomSheetModal>
  )
}

export const TokenSelectorModal = memo(_TokenSelectorModal)

export function TokenSelector(props: TokenSelectorProps): JSX.Element {
  return (
    <Flex shrink backgroundColor="$surface1" height="100%" pt="$spacing8">
      <TokenSelectorContent {...props} />
    </Flex>
  )
}
