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
import { PortfolioValueModifier } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { GqlResult } from 'uniswap/src/data/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FormatNumberOrStringInput } from 'uniswap/src/features/language/formatter'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { CurrencyField } from 'uniswap/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'uniswap/src/features/transactions/transfer/types'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getClipboard } from 'uniswap/src/utils/clipboard'
import { isInterface } from 'utilities/src/platform'
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
  chainId?: UniverseChainId
  valueModifiers?: PortfolioValueModifier[]
  searchHistory?: TokenSearchResult[]
  isSurfaceReady?: boolean
  onClose: () => void
  onDismiss: () => void
  onPressAnimation: () => void
  onSelectChain?: (chainId: UniverseChainId | null) => void
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
  searchHistory,
  onSelectCurrency,
  chainId,
  valueModifiers,
  onClose,
  variation,
  isSurfaceReady = true,
  activeAccountAddress,
  onDismiss,
  onSelectChain,
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

    // Browser doesn't have permissions to access clipboard by default
    // so it will prompt the user to allow clipboard access which is
    // quite jarring and unnecessary.
    if (isInterface) {
      return
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
          activeAccountAddress={activeAccountAddress}
          addToSearchHistoryCallback={addToSearchHistoryCallback}
          chainFilter={chainFilter}
          convertFiatAmountFormattedCallback={convertFiatAmountFormattedCallback}
          debouncedSearchFilter={debouncedSearchFilter}
          formatNumberOrStringCallback={formatNumberOrStringCallback}
          isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
          searchFilter={searchFilter}
          useTokenSectionsForSearchResultsHook={useTokenSectionsForSearchResultsHook}
          useTokenWarningDismissedHook={useTokenWarningDismissedHook}
          valueModifiers={valueModifiers}
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
            searchHistory={searchHistory}
            usePortfolioTokenOptionsHook={usePortfolioTokenOptionsHook}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            valueModifiers={valueModifiers}
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
            searchHistory={searchHistory}
            useFavoriteTokensOptionsHook={useFavoriteTokensOptionsHook}
            usePopularTokensOptionsHook={usePopularTokensOptionsHook}
            usePortfolioTokenOptionsHook={usePortfolioTokenOptionsHook}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            valueModifiers={valueModifiers}
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
            searchHistory={searchHistory}
            useCommonTokensOptionsHook={useCommonTokensOptionsHook}
            useFavoriteTokensOptionsHook={useFavoriteTokensOptionsHook}
            usePopularTokensOptionsHook={usePopularTokensOptionsHook}
            usePortfolioTokenOptionsHook={usePortfolioTokenOptionsHook}
            useTokenWarningDismissedHook={useTokenWarningDismissedHook}
            valueModifiers={valueModifiers}
            onDismiss={onDismiss}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
    }
  }, [
    searchInFocus,
    searchFilter,
    searchHistory,
    variation,
    activeAccountAddress,
    chainFilter,
    debouncedSearchFilter,
    valueModifiers,
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
      <Flex grow gap="$spacing4" px="$spacing16">
        <Flex
          borderBottomColor={isWeb ? '$surface3' : undefined}
          borderBottomWidth={isWeb ? '$spacing1' : undefined}
          py="$spacing4"
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
                  onPressChain={(newChainId) => {
                    onChangeChainFilter(newChainId)
                    onSelectChain?.(newChainId)
                  }}
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
