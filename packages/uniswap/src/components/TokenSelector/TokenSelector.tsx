import type { BottomSheetView } from '@gorhom/bottom-sheet'
import { Currency } from '@uniswap/sdk-core'
import { hasStringAsync } from 'expo-clipboard'
import { ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { spacing, zIndexes } from 'ui/src/theme'
import PasteButton from 'uniswap/src/components/buttons/PasteButton'
import { TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { TokenSelectorEmptySearchList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorEmptySearchList'
import { TokenSelectorSearchResultsList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSearchResultsList'
import { TokenSelectorSendList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSendList'
import { TokenSelectorSwapList } from 'uniswap/src/components/TokenSelector/lists/TokenSelectorSwapList'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/utils'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { SearchContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import {
  ElementName,
  InterfaceEventName,
  ModalName,
  SectionName,
  UniswapEventName,
} from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getClipboard } from 'uniswap/src/utils/clipboard'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isExtensionApp, isMobileApp, isMobileWeb, isWebApp, isWebPlatform } from 'utilities/src/platform'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { useDebounce } from 'utilities/src/time/timing'

export const TOKEN_SELECTOR_WEB_MAX_WIDTH = 400
export const TOKEN_SELECTOR_WEB_MAX_HEIGHT = 700

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // Swap input and output sections specced in 'Multichain UX: Token Selector and Swap' doc on Notion
  SwapInput = 'swap-input', // balances, recent searches, favorites, popular
  SwapOutput = 'swap-output', // suggested bases, balances, recent searches, favorites, popular
}

export interface TokenSelectorProps {
  variation: TokenSelectorVariation
  isModalOpen: boolean
  currencyField: CurrencyField
  flow: TokenSelectorFlow
  evmAddress?: string
  svmAddress?: string
  chainId?: UniverseChainId
  chainIds?: UniverseChainId[]
  input?: TradeableAsset
  output?: TradeableAsset
  isSurfaceReady?: boolean
  isLimits?: boolean
  onClose: () => void
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
  onSelectChain?: (chainId: UniverseChainId | null) => void
  onSelectCurrency: ({
    currency,
    field,
    forceIsBridgePair,
    isPreselectedAsset,
  }: {
    currency: Currency
    field: CurrencyField
    forceIsBridgePair: boolean
    isPreselectedAsset: boolean
  }) => void
}

export function TokenSelectorContent({
  currencyField,
  flow,
  variation,
  input,
  output,
  evmAddress,
  svmAddress,
  chainId,
  chainIds,
  isSurfaceReady = true,
  isLimits,
  onClose,
  onSelectChain,
  onSelectCurrency,
}: Omit<TokenSelectorProps, 'isModalOpen'>): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(chainId ?? null, flowToModalName(flow))
  const debouncedSearchFilter = useDebounce(searchFilter)
  const debouncedParsedSearchFilter = useDebounce(parsedSearchFilter)
  const scrollbarStyles = useScrollbarStyles()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useUniswapContext()

  const media = useMedia()
  const isSmallScreen = (media.sm && isWebApp) || isMobileApp || isMobileWeb

  const [hasClipboardString, setHasClipboardString] = useState(false)

  const { chains: enabledChains, isTestnetModeEnabled } = useEnabledChains()

  // Check if user clipboard has any text to show paste button
  useEffect(() => {
    async function checkClipboard(): Promise<void> {
      const result = await hasStringAsync()
      setHasClipboardString(result)
    }

    // Browser doesn't have permissions to access clipboard by default
    // so it will prompt the user to allow clipboard access which is
    // quite jarring and unnecessary.
    if (isWebApp) {
      return
    }
    checkClipboard().catch(() => undefined)
  }, [])

  const { t } = useTranslation()
  const { page } = useTrace()

  // Log currency field only for swap as for send it's always input
  const currencyFieldName =
    flow === TokenSelectorFlow.Swap
      ? currencyField === CurrencyField.INPUT
        ? ElementName.TokenInputSelector
        : ElementName.TokenOutputSelector
      : undefined

  const onSelectCurrencyCallback = useCallback(
    // eslint-disable-next-line max-params
    (currencyInfo: CurrencyInfo, section: OnchainItemSection<TokenSelectorOption>, index: number): void => {
      const searchContext: SearchContext = {
        category: section.sectionKey,
        query: debouncedSearchFilter ?? undefined,
        position: index + 1,
        suggestionCount: section.data.length,
        searchChainFilter: chainFilter,
      }

      // log event that a currency was selected
      const tokenOption = section.data[index]
      const balanceUSD = Array.isArray(tokenOption) ? undefined : (tokenOption?.balanceUSD ?? undefined)
      sendAnalyticsEvent(UniswapEventName.TokenSelected, {
        name: currencyInfo.currency.name,
        address: currencyAddress(currencyInfo.currency),
        chain: currencyInfo.currency.chainId,
        modal: flowToModalName(flow),
        page,
        field: currencyField,
        token_balance_usd: balanceUSD,
        category: searchContext.category,
        position: searchContext.position,
        suggestion_count: searchContext.suggestionCount,
        query: searchContext.query,
        tokenSection: section.sectionKey,
        preselect_asset: false,
      })

      const forceIsBridgePair = section.sectionKey === OnchainItemSectionName.BridgingTokens
      onSelectCurrency({
        currency: currencyInfo.currency,
        field: currencyField,
        forceIsBridgePair,
        isPreselectedAsset: false,
      })
    },
    [debouncedSearchFilter, chainFilter, flow, page, currencyField, onSelectCurrency],
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
    navigateToBuyOrReceiveWithEmptyWallet?.()
  }, [navigateToBuyOrReceiveWithEmptyWallet, onClose])

  function onCancel(): void {
    setSearchInFocus(false)
  }
  function onFocus(): void {
    if (!isWebPlatform) {
      setSearchInFocus(true)
    }
  }

  const shouldAutoFocusSearch = isWebPlatform && !media.sm

  const tokenSelector = useMemo(() => {
    if (searchInFocus && !searchFilter && !isTestnetModeEnabled) {
      return (
        <TokenSelectorEmptySearchList
          evmAddress={evmAddress}
          svmAddress={svmAddress}
          chainFilter={chainFilter}
          onSelectCurrency={onSelectCurrencyCallback}
        />
      )
    }

    if (searchFilter) {
      return (
        <TokenSelectorSearchResultsList
          evmAddress={evmAddress}
          svmAddress={svmAddress}
          chainFilter={chainFilter}
          debouncedParsedSearchFilter={debouncedParsedSearchFilter}
          debouncedSearchFilter={debouncedSearchFilter}
          isBalancesOnlySearch={variation === TokenSelectorVariation.BalancesOnly}
          parsedChainFilter={parsedChainFilter}
          searchFilter={searchFilter}
          input={input}
          onSelectCurrency={onSelectCurrencyCallback}
        />
      )
    }

    switch (variation) {
      case TokenSelectorVariation.BalancesOnly:
        return (
          <TokenSelectorSendList
            evmAddress={evmAddress}
            svmAddress={svmAddress}
            chainFilter={chainFilter}
            onEmptyActionPress={onSendEmptyActionPress}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      case TokenSelectorVariation.SwapInput:
        return (
          <TokenSelectorSwapList
            oppositeSelectedToken={output}
            evmAddress={evmAddress}
            svmAddress={svmAddress}
            chainFilter={chainFilter}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      case TokenSelectorVariation.SwapOutput:
        return (
          <TokenSelectorSwapList
            oppositeSelectedToken={input}
            evmAddress={evmAddress}
            svmAddress={svmAddress}
            chainFilter={chainFilter}
            onSelectCurrency={onSelectCurrencyCallback}
          />
        )
      default:
        return undefined
    }
  }, [
    searchInFocus,
    searchFilter,
    isTestnetModeEnabled,
    variation,
    evmAddress,
    svmAddress,
    chainFilter,
    onSelectCurrencyCallback,
    debouncedParsedSearchFilter,
    debouncedSearchFilter,
    parsedChainFilter,
    input,
    onSendEmptyActionPress,
    output,
  ])

  return (
    <Trace
      logImpression={isWebApp} // TODO(WEB-5161): Deduplicate shared vs interface-only trace event
      eventOnTrigger={InterfaceEventName.TokenSelectorOpened}
      modal={ModalName.TokenSelectorWeb}
    >
      <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
        <Flex grow gap="$spacing8" style={scrollbarStyles}>
          {!isSmallScreen && (
            <Flex row justifyContent="space-between" pt="$spacing16" px="$spacing16">
              <Text variant="subheading1">{t('common.selectToken.label')}</Text>
              <ModalCloseIcon onClose={onClose} />
            </Flex>
          )}
          <SearchTextInput
            autoFocus={shouldAutoFocusSearch}
            backgroundColor="$surface2"
            endAdornment={
              <Flex row alignItems="center">
                {hasClipboardString && <PasteButton inline textVariant="buttonLabel3" onPress={handlePaste} />}
                <NetworkFilter
                  includeAllNetworks={!isTestnetModeEnabled}
                  chainIds={chainIds || enabledChains}
                  selectedChain={chainFilter}
                  styles={isExtensionApp || isMobileWeb ? { dropdownZIndex: zIndexes.overlay } : undefined}
                  onPressChain={(newChainId) => {
                    onChangeChainFilter(newChainId)
                    onSelectChain?.(newChainId)
                  }}
                />
              </Flex>
            }
            placeholder={t('tokens.selector.search.placeholder')}
            px="$spacing16"
            py="$none"
            mx={spacing.spacing16}
            my="$spacing4"
            value={searchFilter ?? ''}
            onCancel={isWebPlatform ? undefined : onCancel}
            onChangeText={onChangeText}
            onFocus={onFocus}
          />
          {isLimits && (
            <Flex
              row
              backgroundColor="$surface2"
              borderRadius="$rounded12"
              gap="$spacing12"
              mx="$spacing8"
              p="$spacing12"
            >
              <InfoCircleFilled color="$neutral2" size="$icon.20" />
              <Text variant="body3">{t('limits.form.disclaimer.mainnet.short')}</Text>
            </Flex>
          )}
          {isSurfaceReady && <Flex grow>{tokenSelector}</Flex>}
        </Flex>
      </Trace>
    </Trace>
  )
}

function TokenSelectorModalContent(props: TokenSelectorProps): JSX.Element {
  const { isModalOpen } = props
  const { isSheetReady } = useBottomSheetContext()

  useEffect(() => {
    if (isModalOpen) {
      // Dismiss native keyboard when opening modal in case it was opened by the current screen.
      dismissNativeKeyboard()
    }
  }, [isModalOpen])

  return <TokenSelectorContent {...props} isSurfaceReady={isSheetReady} />
}

function _TokenSelectorModal(props: TokenSelectorProps): JSX.Element {
  const colors = useSporeColors()
  const { isModalOpen, onClose, focusHook } = props

  return (
    <Modal
      extendOnKeyboardVisible
      fullScreen
      hideKeyboardOnDismiss
      hideKeyboardOnSwipeDown
      renderBehindBottomInset
      backgroundColor={colors.surface1.val}
      isModalOpen={isModalOpen}
      maxWidth={isWebPlatform ? TOKEN_SELECTOR_WEB_MAX_WIDTH : undefined}
      maxHeight={isWebApp ? TOKEN_SELECTOR_WEB_MAX_HEIGHT : undefined}
      name={ModalName.TokenSelector}
      padding="$none"
      snapPoints={['65%', '100%']}
      height={isWebApp ? '100vh' : undefined}
      focusHook={focusHook}
      onClose={onClose}
    >
      <TokenSelectorModalContent {...props} />
    </Modal>
  )
}

export const TokenSelectorModal = memo(_TokenSelectorModal)
