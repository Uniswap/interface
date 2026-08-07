import { isMobileApp, isMobileWeb, isWebApp, isWebIOS, isWebPlatform } from '@universe/environment'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, LinearGradient, Text, useMedia, useScrollbarStyles } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import PasteButton from 'uniswap/src/components/buttons/PasteButton'
import { useNetworkSelectorOptions } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkSelectorOptions'
import { CrosschainSwapsPromoBanner } from 'uniswap/src/components/TokenSelector/CrosschainSwapsPromoBanner'
import { useClipboardCheck } from 'uniswap/src/components/TokenSelector/hooks/useClipboardCheck'
import { usePortfolioBalancesForAddressById } from 'uniswap/src/components/TokenSelector/hooks/usePortfolioBalancesForAddressById'
import { useTokenSelectionHandler } from 'uniswap/src/components/TokenSelector/hooks/useTokenSelectionHandler'
import type { TokenSelectorProps } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow, TokenSelectorVariation } from 'uniswap/src/components/TokenSelector/types'
import { UnsupportedChainedActionsBanner } from 'uniswap/src/components/TokenSelector/UnsupportedChainedActionsBanner'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/utils'
import {
  TOKEN_SELECTOR_V2_CONTROL_HEIGHT,
  TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED,
  TOKEN_SELECTOR_V2_SIDEBAR_TOTAL_WIDTH,
} from 'uniswap/src/components/TokenSelectorV2/constants'
import { getSupportsSidebar } from 'uniswap/src/components/TokenSelectorV2/getSupportsSidebar'
import { MyTokensSidebar } from 'uniswap/src/components/TokenSelectorV2/MyTokensSidebar'
import { NetworkFilterChipRow } from 'uniswap/src/components/TokenSelectorV2/NetworkFilterChipRow'
import { PortfolioToggleButton } from 'uniswap/src/components/TokenSelectorV2/PortfolioToggleButton'
import { TokenSelectorV2ListSwitch } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2ListSwitch'
import { TokenSelectorV2Skeleton } from 'uniswap/src/components/TokenSelectorV2/TokenSelectorV2Skeleton'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useFilterCallbacks } from 'uniswap/src/features/search/SearchModal/hooks/useFilterCallbacks'
import { SearchTextInput } from 'uniswap/src/features/search/SearchTextInput'
import { InterfaceEventName, ModalName, SectionName, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isChainSupportedForChainedActions } from 'uniswap/src/features/transactions/swap/utils/chainedActions'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getClipboard } from 'utilities/src/clipboard/clipboard'
import { useEvent } from 'utilities/src/react/hooks'
import { useDebounce } from 'utilities/src/time/timing'

const BOTTOM_FADE_HEIGHT = 32

export type TokenSelectorV2ContentProps = Omit<TokenSelectorProps, 'isModalOpen'> & { renderedInModal: boolean }

/**
 * TokenSelectorV2 surface (Milestone 2 UX revamp, behind FeatureFlags.TokenSelectorUxRevamp).
 * Dual-pane on web desktop for swap (discovery list + My-tokens sidebar); single-pane with the
 * chip row and redesigned sections on mobile, extension, small web, and send.
 */
export function TokenSelectorV2Content({
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
}: TokenSelectorV2ContentProps): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter, parsedChainFilter, parsedSearchFilter } =
    useFilterCallbacks(chainId ?? null, flowToModalName(flow))
  const debouncedSearchFilter = useDebounce(searchFilter)
  const debouncedParsedSearchFilter = useDebounce(parsedSearchFilter)
  const scrollbarStyles = useScrollbarStyles()
  const { navigateToBuyOrReceiveWithEmptyWallet } = useUniswapContext()
  const { t } = useTranslation()

  const oppositeToken = currencyField === CurrencyField.INPUT ? output : input

  const media = useMedia()
  const isSmallScreen = (media.sm && isWebApp) || isMobileApp || isMobileWeb

  const hasClipboardString = useClipboardCheck()

  const { chains: enabledChains, isTestnetModeEnabled } = useEnabledChains()
  const effectiveChainIds = chainIds ?? enabledChains

  const supportsSidebar = getSupportsSidebar({ isSmallScreen, variation, addresses })

  // Input opens with the sidebar visible; output opens collapsed (Figma Input/Output.Default).
  // State intentionally resets per open — nothing persists this today (SWAP-3040 decision).
  const [sidebarExpanded, setSidebarExpanded] = useState(variation === TokenSelectorVariation.SwapInput)

  const onToggleSidebar = useEvent(() => {
    const next = !sidebarExpanded
    sendAnalyticsEvent(UniswapEventName.TokenSelectorSidebarToggled, {
      expanded: next,
      field: currencyField,
    })
    setSidebarExpanded(next)
  })

  // Fetched once here and shared by the sidebar and every section hook (no per-pane refetch).
  const portfolioData = usePortfolioBalancesForAddressById(addresses)

  const tieredNetworkOptions = useNetworkSelectorOptions({
    addresses,
    chainIds: effectiveChainIds,
    enabled: true,
  })

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
  // Defer one render so the modal paints first (same fix as the legacy selector).
  const [searchInputMounted, setSearchInputMounted] = useState(!isWebIOS)

  useEffect(() => {
    setSearchInputMounted(true)
  }, [])

  const shouldShowCrosschainPromoBanner = useMemo(
    () => flow === TokenSelectorFlow.Swap && (!chainFilter || isChainSupportedForChainedActions(chainFilter)),
    [flow, chainFilter],
  )

  const onPressChain = useCallback(
    (newChainId: UniverseChainId | null) => {
      onChangeChainFilter(newChainId)
      onSelectChain?.(newChainId)
    },
    [onChangeChainFilter, onSelectChain],
  )

  const showSidebar = supportsSidebar && sidebarExpanded

  const mainPane = (
    <Flex
      grow
      shrink
      flexBasis={0}
      backgroundColor="$surface1"
      borderColor={supportsSidebar ? '$surface5' : undefined}
      borderRadius={supportsSidebar ? '$rounded12' : undefined}
      borderWidth={supportsSidebar ? 1 : 0}
      gap="$spacing8"
      overflow="hidden"
      pt="$spacing12"
    >
      {searchInputMounted && (
        // mb + the pane's gap-8 = 12px below the search bar, matching the Figma field wrapper
        <Flex row alignItems="center" gap="$spacing8" mb="$spacing4" mx="$spacing12">
          <Flex fill>
            <SearchTextInput
              autoFocus={shouldAutoFocusSearch}
              backgroundColor="$surface2"
              endAdornment={
                hasClipboardString ? <PasteButton inline textVariant="buttonLabel3" onPress={handlePaste} /> : null
              }
              borderColor="$surface3"
              borderWidth={1}
              borderRadius="$rounded16"
              minHeight={TOKEN_SELECTOR_V2_CONTROL_HEIGHT}
              placeholder={t('tokens.selector.search.placeholder')}
              px="$spacing12"
              py="$none"
              value={searchFilter ?? ''}
              onCancel={isWebPlatform ? undefined : onCancel}
              onChangeText={onChangeText}
              onFocus={onFocus}
            />
          </Flex>
          {supportsSidebar && !sidebarExpanded && (
            <PortfolioToggleButton addresses={addresses} onPress={onToggleSidebar} />
          )}
        </Flex>
      )}
      <NetworkFilterChipRow
        chainIds={effectiveChainIds}
        isTestnetModeEnabled={isTestnetModeEnabled}
        mode={variation === TokenSelectorVariation.SwapOutput ? 'labeled' : 'compact'}
        selectedChain={chainFilter}
        tieredOptions={tieredNetworkOptions}
        onPressChain={onPressChain}
      />
      {flow === TokenSelectorFlow.Limit && (
        <Flex row backgroundColor="$surface2" borderRadius="$rounded12" gap="$spacing12" mx="$spacing8" p="$spacing12">
          <InfoCircleFilled color="$neutral2" size="$icon.20" />
          <Text variant="body3">{t('limits.form.disclaimer.mainnet.short')}</Text>
        </Flex>
      )}
      <Flex grow position="relative">
        {isSurfaceReady ? (
          <>
            {shouldShowCrosschainPromoBanner && <CrosschainSwapsPromoBanner />}
            <UnsupportedChainedActionsBanner oppositeToken={oppositeToken} chainFilter={chainFilter ?? undefined} />
            <TokenSelectorV2ListSwitch
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
              includeYourTokens={!supportsSidebar}
              portfolioData={portfolioData}
              debouncedParsedSearchFilter={debouncedParsedSearchFilter}
              debouncedSearchFilter={debouncedSearchFilter}
              parsedChainFilter={parsedChainFilter}
              onSelectCurrency={onSelectCurrencyCallback}
              onSelectRwaToken={onSelectRwaToken}
              onSendEmptyActionPress={onSendEmptyActionPress}
            />
          </>
        ) : (
          <TokenSelectorV2Skeleton />
        )}
        {/* Rows fade out at the pane's bottom edge instead of hard-clipping (Figma 750:13045) */}
        <LinearGradient
          colors={['transparent', '$surface1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          height={BOTTOM_FADE_HEIGHT}
          pointerEvents="none"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
        />
      </Flex>
    </Flex>
  )

  return (
    <Trace
      logImpression={isWebApp} // TODO(WEB-5161): Deduplicate shared vs interface-only trace event
      eventOnTrigger={InterfaceEventName.TokenSelectorOpened}
      modal={ModalName.TokenSelectorWeb}
    >
      <Trace logImpression element={currencyFieldName} section={SectionName.TokenSelector}>
        <Flex
          grow
          row
          backgroundColor={supportsSidebar ? '$surface2' : undefined}
          p={supportsSidebar ? '$spacing8' : undefined}
          style={scrollbarStyles}
        >
          {mainPane}
          <AnimatePresence>
            {showSidebar && (
              // Negative mr bleeds the sidebar through the outer surface2 frame so its scrollbar rides the modal edge.
              <Flex
                key="my-tokens-sidebar"
                animation="quick"
                animateOnly={['width', 'opacity', 'marginLeft', 'marginRight']}
                enterStyle={{ width: 0, opacity: 0, ml: 0, mr: 0 }}
                exitStyle={{ width: 0, opacity: 0, ml: 0, mr: 0 }}
                ml="$spacing8"
                mr={-TOKEN_SELECTOR_V2_SIDEBAR_EDGE_BLEED}
                opacity={1}
                overflow="hidden"
                width={TOKEN_SELECTOR_V2_SIDEBAR_TOTAL_WIDTH}
              >
                <MyTokensSidebar
                  addresses={addresses}
                  chainFilter={chainFilter}
                  chainIds={effectiveChainIds}
                  portfolioData={portfolioData}
                  searchFilter={debouncedSearchFilter}
                  onCollapse={onToggleSidebar}
                  onSelectCurrency={onSelectCurrencyCallback}
                />
              </Flex>
            )}
          </AnimatePresence>
        </Flex>
      </Trace>
    </Trace>
  )
}
