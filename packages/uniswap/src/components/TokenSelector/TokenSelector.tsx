import type { BottomSheetView } from '@gorhom/bottom-sheet'
import { Currency } from '@uniswap/sdk-core'
import { isExtensionApp, isMobileApp, isMobileWeb, isWebApp, isWebIOS, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ComponentProps, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, ModalCloseIcon, Text, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { spacing, zIndexes } from 'ui/src/theme'
import PasteButton from 'uniswap/src/components/buttons/PasteButton'
import { SelectorBaseListSkeleton } from 'uniswap/src/components/lists/SelectorBaseList'
import { useBottomSheetContext } from 'uniswap/src/components/modals/BottomSheetContext'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { NetworkFilterV2 } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkSelectorOptions'
import { CrosschainSwapsPromoBanner } from 'uniswap/src/components/TokenSelector/CrosschainSwapsPromoBanner'
import { useClipboardCheck } from 'uniswap/src/components/TokenSelector/hooks/useClipboardCheck'
import { useTokenSelectionHandler } from 'uniswap/src/components/TokenSelector/hooks/useTokenSelectionHandler'
import { TokenSelectorListSwitch } from 'uniswap/src/components/TokenSelector/TokenSelectorListSwitch'
import type { OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import { TokenSelectorFlow, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { UnsupportedChainedActionsBanner } from 'uniswap/src/components/TokenSelector/UnsupportedChainedActionsBanner'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/utils'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { InterfaceEventName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isChainSupportedForChainedActions } from 'uniswap/src/features/transactions/swap/utils/chainedActions'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getClipboard } from 'utilities/src/clipboard/clipboard'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useDebounce } from 'utilities/src/time/timing'

export const TOKEN_SELECTOR_WEB_MAX_WIDTH = 400
export const TOKEN_SELECTOR_WEB_MAX_HEIGHT = 700

export const SNAP_POINTS = ['65%', '100%']

export interface TokenSelectorProps {
  variation: TokenSelectorVariation
  isModalOpen: boolean
  currencyField: CurrencyField
  flow: TokenSelectorFlow
  addresses: AddressGroup
  chainId?: UniverseChainId
  chainIds?: UniverseChainId[]
  input?: TradeableAsset
  output?: TradeableAsset
  isSurfaceReady?: boolean
  onClose: () => void
  focusHook?: ComponentProps<typeof BottomSheetView>['focusHook']
  onSelectChain?: (chainId: UniverseChainId | null) => void
  onSelectCurrency: ({
    currency,
    field,
    allowCrossChainPair,
    isPreselectedAsset,
  }: {
    currency: Currency
    field: CurrencyField
    allowCrossChainPair: boolean
    isPreselectedAsset: boolean
  }) => void
  onSelectRwaToken?: OnSelectRwaToken
}

function TokenSelectorNetworkFilter({
  tieredOptions,
  networkFilterV2Enabled,
  styles,
  ...props
}: {
  tieredOptions: TieredNetworkOptions | undefined
  networkFilterV2Enabled: boolean
} & ComponentProps<typeof NetworkFilter>): JSX.Element {
  if (networkFilterV2Enabled) {
    return <NetworkFilterV2 {...props} tieredOptions={tieredOptions} />
  }

  return <NetworkFilter {...props} styles={styles} />
}

export function TokenSelectorContent({
  currencyField,
  flow,
  variation,
  input,
  output,
  addresses,
  chainId,
  chainIds,
  isSurfaceReady = true,
  onClose,
  onSelectChain,
  onSelectCurrency,
  onSelectRwaToken,
  renderedInModal,
}: Omit<TokenSelectorProps, 'isModalOpen'> & {
  renderedInModal: boolean
}): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(chainId ?? null, flowToModalName(flow))
  const debouncedSearchFilter = useDebounce(searchFilter)
  const debouncedParsedSearchFilter = useDebounce(parsedSearchFilter)
  const scrollbarStyles = useScrollbarStyles()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useUniswapContext()

  const oppositeToken = currencyField === CurrencyField.INPUT ? output : input

  const media = useMedia()
  const isSmallScreen = (media.sm && isWebApp) || isMobileApp || isMobileWeb

  const hasClipboardString = useClipboardCheck()

  const { chains: enabledChains, isTestnetModeEnabled } = useEnabledChains()

  const isNetworkFilterV2FlagEnabled = useFeatureFlag(FeatureFlags.NetworkFilterV2)
  const networkFilterV2Enabled =
    isNetworkFilterV2FlagEnabled &&
    [TokenSelectorVariation.SwapInput, TokenSelectorVariation.SwapOutput, TokenSelectorVariation.BalancesOnly].includes(
      variation,
    )
  const effectiveChainIds = chainIds ?? enabledChains

  const tieredNetworkOptions = useNetworkSelectorOptions({
    addresses,
    chainIds: effectiveChainIds,
    enabled: networkFilterV2Enabled,
  })

  const { t } = useTranslation()

  const { currencyFieldName, onSelectCurrencyCallback } = useTokenSelectionHandler({
    flow,
    currencyField,
    chainFilter,
    oppositeToken,
    debouncedSearchFilter,
    onSelectCurrency,
  })

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

  // Mounting SearchTextInput on the same render that modal opens caused jitter on Safari mWeb.
  // Defer one render so the modal paints first.
  const [searchInputMounted, setSearchInputMounted] = useState(!isWebIOS)

  useEffect(() => {
    setSearchInputMounted(true)
  }, [])

  const shouldShowCrosschainPromoBanner = useMemo(
    () => flow === TokenSelectorFlow.Swap && (!chainFilter || isChainSupportedForChainedActions(chainFilter)),
    [flow, chainFilter],
  )

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
          {searchInputMounted && (
            <SearchTextInput
              autoFocus={shouldAutoFocusSearch}
              backgroundColor="$surface2"
              endAdornment={
                <Flex row alignItems="center">
                  {hasClipboardString && <PasteButton inline textVariant="buttonLabel3" onPress={handlePaste} />}
                  <TokenSelectorNetworkFilter
                    tieredOptions={tieredNetworkOptions}
                    networkFilterV2Enabled={networkFilterV2Enabled}
                    includeAllNetworks={!isTestnetModeEnabled && effectiveChainIds.length > 1}
                    chainIds={effectiveChainIds}
                    selectedChain={chainFilter}
                    styles={isExtensionApp || media.md ? { dropdownZIndex: zIndexes.overlay } : undefined}
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
          )}
          {flow === TokenSelectorFlow.Limit && (
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

          <Flex grow>
            {isSurfaceReady ? (
              <>
                {shouldShowCrosschainPromoBanner && <CrosschainSwapsPromoBanner />}
                <UnsupportedChainedActionsBanner oppositeToken={oppositeToken} chainFilter={chainFilter ?? undefined} />
                <TokenSelectorListSwitch
                  searchInFocus={searchInFocus}
                  searchFilter={searchFilter}
                  isTestnetModeEnabled={isTestnetModeEnabled}
                  variation={variation}
                  addresses={addresses}
                  chainFilter={chainFilter}
                  chainIds={effectiveChainIds}
                  input={input}
                  output={output}
                  renderedInModal={renderedInModal}
                  debouncedParsedSearchFilter={debouncedParsedSearchFilter}
                  debouncedSearchFilter={debouncedSearchFilter}
                  parsedChainFilter={parsedChainFilter}
                  onSelectCurrency={onSelectCurrencyCallback}
                  onSelectRwaToken={onSelectRwaToken}
                  onSendEmptyActionPress={onSendEmptyActionPress}
                />
              </>
            ) : (
              <SelectorBaseListSkeleton />
            )}
          </Flex>
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

  return <TokenSelectorContent {...props} isSurfaceReady={isSheetReady} renderedInModal={true} />
}

function TokenSelectorModalInner(props: TokenSelectorProps): JSX.Element {
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
      snapPoints={SNAP_POINTS}
      height={isWebApp ? '100vh' : undefined}
      focusHook={focusHook}
      onClose={onClose}
    >
      <Flex grow maxHeight="100%" overflow="hidden">
        <TokenSelectorModalContent {...props} />
      </Flex>
    </Modal>
  )
}

export const TokenSelectorModal = memo(TokenSelectorModalInner)
