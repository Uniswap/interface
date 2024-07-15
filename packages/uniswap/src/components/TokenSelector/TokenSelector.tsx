import { Currency } from '@uniswap/sdk-core'
import { hasStringAsync } from 'expo-clipboard'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, isWeb, useSporeColors } from 'ui/src'
import { zIndices } from 'ui/src/theme'
import { TokenSelectorEmptySearchList } from 'uniswap/src/components/TokenSelector/TokenSelectorEmptySearchList'
import { TokenSelectorSearchResultsList } from 'uniswap/src/components/TokenSelector/TokenSelectorSearchResultsList'
import { TokenSelectorSendList } from 'uniswap/src/components/TokenSelector/TokenSelectorSendList'
import { TokenSelectorSwapInputList } from 'uniswap/src/components/TokenSelector/TokenSelectorSwapInputList'
import { TokenSelectorSwapOutputList } from 'uniswap/src/components/TokenSelector/TokenSelectorSwapOutputList'
import {
  ConvertFiatAmountFormattedCallback,
  FilterCallbacksHookType,
  SuggestedTokenSection,
  TokenOptionsHookType,
  TokenOptionsWithBalanceOnlySearchHookType,
  TokenOptionsWithChainFilterHookType,
  TokenSection,
  TokenWarningDismissedHook,
} from 'uniswap/src/components/TokenSelector/types'
import PasteButton from 'uniswap/src/components/buttons/PasteButton'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { WalletChainId } from 'uniswap/src/types/chains'
import { getClipboard } from 'uniswap/src/utils/clipboard'
import { useDebounce } from 'utilities/src/time/timing'

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
  activeAccountAddress: string
  chainId?: WalletChainId
  isSurfaceReady?: boolean
  onClose: () => void
  onDismiss: () => void
  onPressAnimation: () => void
  onSelectCurrency: (currency: Currency, currencyField: CurrencyField, context: SearchContext) => void
  variation: TokenSelectorVariation
  addToSearchHistoryCallback: (currencyInfo: CurrencyInfo) => void
  navigateToBuyOrReceiveWithEmptyWalletCallback: () => void
  convertFiatAmountFormattedCallback: ConvertFiatAmountFormattedCallback
  formatNumberOrStringCallback: (input: FormatNumberOrStringInput) => string
  useTokenWarningDismissedHook: TokenWarningDismissedHook
  useCommonTokensOptionsHook: TokenOptionsHookType
  useFavoriteTokensOptionsHook: TokenOptionsHookType
  usePopularTokensOptionsHook: TokenOptionsWithChainFilterHookType
  usePortfolioTokenOptionsHook: TokenOptionsHookType
  useTokenSectionsForEmptySearchHook: () => GqlResult<TokenSection[]>
  useTokenSectionsForSearchResultsHook: TokenOptionsWithBalanceOnlySearchHookType
  useFilterCallbacksHook: FilterCallbacksHookType
}

function TokenSelectorContent({
  currencyField,
  flow,
  onSelectCurrency,
  chainId,
  onClose,
  variation,
  isSurfaceReady = true,
  activeAccountAddress,
  onDismiss,
  onPressAnimation,
  addToSearchHistoryCallback,
  convertFiatAmountFormattedCallback,
  formatNumberOrStringCallback,
  navigateToBuyOrReceiveWithEmptyWalletCallback,
  useCommonTokensOptionsHook,
  useFavoriteTokensOptionsHook,
  usePopularTokensOptionsHook,
  usePortfolioTokenOptionsHook,
  useTokenWarningDismissedHook,
  useTokenSectionsForEmptySearchHook,
  useTokenSectionsForSearchResultsHook,
  useFilterCallbacksHook,
}: TokenSelectorProps): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter } = useFilterCallbacksHook(chainId ?? null, flow)
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
    (currencyInfo: CurrencyInfo, section: SuggestedTokenSection | TokenSection, index: number): void => {
      const searchContext: SearchContext = {
        category: section.title,
        query: debouncedSearchFilter ?? undefined,
        position: index + 1,
        suggestionCount: section.data.length,
      }

      onSelectCurrency(currencyInfo.currency, currencyField, searchContext)
    },
    [currencyField, onSelectCurrency, debouncedSearchFilter],
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
    navigateToBuyOrReceiveWithEmptyWalletCallback()
  }, [navigateToBuyOrReceiveWithEmptyWalletCallback, onClose])

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
      return (
        <TokenSelectorEmptySearchList
          convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
          formatNumberOrStringCallback={formatNumberOrStringCallback}
          useTokenSectionsForEmptySearchHook={useTokenSectionsForEmptySearchHook}
          useTokenWarningDismissedHook={useTokenWarningDismissedHook}
          onDismiss={onDismiss}
          onSelectCurrency={onSelectCurrencyCallback}
        />
      )
    }

    if (searchFilter) {
      return (
        <TokenSelectorSearchResultsList
          addToSearchHistoryCallback={addToSearchHistoryCallback}
          chainFilter={chainFilter}
          convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
          debouncedSearchFilter={debouncedSearchFilter}
          formatNumberOrStringCallback={formatNumberOrStringCallback}
          isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
          searchFilter={searchFilter}
          useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResultsHook}
          useTokenWarningDismissedHook={useTokenWarningDismissedHook}
          onDismiss={onDismiss}
          onSelectCurrency={onSelectCurrencyCallback}
        />
      )
    }

    switch (variation) {
      case TokenSelectorVariation.BalancesOnly:
        return (
          <TokenSelectorSendList
            activeAccountAddress={activeAccountAddress}
            chainFilter={chainFilter}
            convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
            formatNumberOrStringCallback={formatNumberOrStringCallback}
            usePortfolioTokenOptionsHook={usePortfolioTokenOptionsHook}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            onDismiss={onDismiss}
            onEmptyActionPress={onSendEmptyActionPress}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      case TokenSelectorVariation.BalancesAndPopular:
        return (
          <TokenSelectorSwapInputList
            activeAccountAddress={activeAccountAddress}
            chainFilter={chainFilter}
            convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
            formatNumberOrStringCallback={formatNumberOrStringCallback}
            usePopularTokensOptionsHook={usePopularTokensOptionsHook}
            usePortfolioTokenOptionsHook={usePortfolioTokenOptionsHook}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            onDismiss={onDismiss}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      case TokenSelectorVariation.SuggestedAndFavoritesAndPopular:
        return (
          <TokenSelectorSwapOutputList
            activeAccountAddress={activeAccountAddress}
            chainFilter={chainFilter}
            convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
            formatNumberOrStringCallback={formatNumberOrStringCallback}
            useCommonTokensOptionsHook={useCommonTokensOptionsHook}
            useFavoriteTokensOptionsHook={useFavoriteTokensOptionsHook}
            usePopularTokensOptionsHook={usePopularTokensOptionsHook}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            onDismiss={onDismiss}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
    }
  }, [
    searchInFocus,
    searchFilter,
    variation,
    activeAccountAddress,
    chainFilter,
    debouncedSearchFilter,
    onDismiss,
    addToSearchHistoryCallback,
    convertFiatAmountFormattedCallback,
    formatNumberOrStringCallback,
    onSelectCurrencyCallback,
    onSendEmptyActionPress,
    useCommonTokensOptionsHook,
    useFavoriteTokensOptionsHook,
    usePopularTokensOptionsHook,
    usePortfolioTokenOptionsHook,
    useTokenSectionsForEmptySearchHook,
    useTokenSectionsForSearchResultsHook,
    useTokenWarningDismissedHook,
  ])

  return (
    <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
      <Flex grow gap={isWeb ? '$spacing4' : '$spacing16'} px="$spacing16">
        <Flex
          borderBottomColor={isWeb ? '$surface3' : undefined}
          borderBottomWidth={isWeb ? '$spacing1' : undefined}
          py="$spacing8"
        >
          <SearchTextInput
            autoFocus={isWeb}
            backgroundColor={isWeb ? '$surface1' : '$surface2'}
            endAdornment={hasClipboardString ? <PasteButton inline onPress={handlePaste} /> : null}
            placeholder={t('tokens.selector.search.placeholder')}
            px={isWeb ? '$none' : '$spacing16'}
            py="$none"
            value={searchFilter ?? ''}
            onCancel={isWeb ? undefined : onCancel}
            onChangeText={onChangeText}
            onClose={isWeb ? onClose : undefined}
            onDismiss={onDismiss}
            onFocus={isWeb ? undefined : onFocus}
          />
        </Flex>
        {isSurfaceReady && (
          <Flex grow>
            {tokenSelector}

            {(!searchInFocus || searchFilter) && (
              <Flex position="absolute" right={0} top={5} zIndex={zIndices.fixed}>
                <NetworkFilter
                  includeAllNetworks
                  selectedChain={chainFilter}
                  onDismiss={onDismiss}
                  onPressAnimation={onPressAnimation}
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
  const { onDismiss, onClose } = props

  useEffect(() => {
    // Dismiss native keyboard when opening modal in case it was opened by the current screen.
    onDismiss()
  }, [onDismiss])

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
      onClose={onClose}
    >
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
