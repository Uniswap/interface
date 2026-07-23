import type { Currency } from '@uniswap/sdk-core'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import type { SegmentedControlOption } from 'ui/src'
import { Flex, SegmentedControl, stackingLayerAbove, styled, Text, Tooltip, useMedia, WidthAnimator } from 'ui/src'
import type { AppTFunction } from 'ui/src/i18n/types'
import { zIndexes } from 'ui/src/theme'
import { TokenSelectorHoverConfigProvider } from 'uniswap/src/components/TokenSelector/TokenSelectorHoverConfig'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { ShowGetStartedProvider } from 'uniswap/src/features/passkey/ShowGetStartedContext'
import { WebFORNudgeProvider } from 'uniswap/src/features/providers/webForNudgeProvider'
import { InterfaceEventName, InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import type {
  PasskeyAuthStatus,
  SwapRedirectFn,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { TokenHoverCard } from '~/components/TokenHoverCard/TokenHoverCard'
import { SwapAndLimitContextProvider } from '~/features/Swap/state/SwapContext'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { PAGE_WRAPPER_MAX_WIDTH, PageWrapper, SwapModuleWrapper } from '~/features/Swap/styled'
import { useHasInjectedWallets } from '~/features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useDeferredComponent } from '~/hooks/useDeferredComponent'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { useModalState } from '~/hooks/useModalState'
import { ReturnToAuctionBanner } from '~/pages/Swap/ReturnToAuctionBanner'
import { SlideoutChartCard } from '~/pages/Swap/Swap/SlideoutChartCard/SlideoutChartCard'
import { useSlideoutChartCardCurrencies } from '~/pages/Swap/Swap/SlideoutChartCard/useSlideoutChartCardCurrencies'
import { useInitialCurrencyState } from '~/pages/Swap/Swap/state/hooks'
import { SwapChartToggleButton } from '~/pages/Swap/Swap/SwapChartToggleButton'
import { SwapForm, SwapFormSettingsButton } from '~/pages/Swap/Swap/SwapForm'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { MultichainContextProvider } from '~/state/multichain/MultichainContext'
import { isIFramed } from '~/utils/isIFramed'

function wrapWithTokenHoverCard(element: JSX.Element, currencyInfo: CurrencyInfo): JSX.Element {
  return (
    <TokenHoverCard currencyInfo={currencyInfo} placement="right-start" offset={8}>
      {element}
    </TokenHoverCard>
  )
}

export function SwapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // (WEB-4737): Remove this line after completing A/A Test on Web
  useFeatureFlag(FeatureFlags.AATestWeb)

  const accountDrawer = useAccountDrawer()

  const {
    initialInputCurrency,
    initialOutputCurrency,
    initialInputChainId,
    initialOutputChainId,
    initialTypedValue,
    initialField,
    triggerConnect,
  } = useInitialCurrencyState()

  useEffect(() => {
    if (triggerConnect) {
      accountDrawer.open()
      navigate(location.pathname, { replace: true })
    }
  }, [accountDrawer, triggerConnect, navigate, location.pathname])

  return (
    <Trace logImpression page={InterfacePageName.SwapPage}>
      <PageWrapper>
        <WebFORNudgeProvider>
          <Swap
            initialInputChainId={initialInputChainId}
            initialInputCurrency={initialInputCurrency}
            initialOutputCurrency={initialOutputCurrency}
            initialOutputChainId={initialOutputChainId}
            initialTypedValue={initialTypedValue}
            initialIndependentField={initialField}
            syncTabToUrl={true}
          />
        </WebFORNudgeProvider>
      </PageWrapper>
      <ReturnToAuctionBanner />
    </Trace>
  )
}

/**
 * The swap component displays the swap interface, manages state for the swap, and triggers onchain swaps.
 *
 * In most cases, chainId should refer to the connected chain, i.e. `useAccount().chainId`.
 * However if this component is being used in a context that displays information from a different, unconnected
 * chain (e.g. the TDP), then chainId should refer to the unconnected chain.
 */
export function Swap({
  initialInputCurrency,
  initialOutputCurrency,
  initialOutputChainId,
  initialTypedValue,
  initialIndependentField,
  initialInputChainId,
  hideHeader = false,
  hideFooter = false,
  hideChart = false,
  onCurrencyChange,
  syncTabToUrl,
  swapRedirectCallback,
  tokenColor,
  tdpCurrency,
}: {
  initialInputChainId?: UniverseChainId
  onCurrencyChange?: (selected: CurrencyState) => void
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialOutputChainId?: UniverseChainId
  initialTypedValue?: string
  initialIndependentField?: CurrencyField
  syncTabToUrl: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  hideChart?: boolean
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
  passkeyAuthStatus?: PasskeyAuthStatus
  /** When Swap is embedded in Token Details Page, pass the TDP token currency for Buy/Sell prefill */
  tdpCurrency?: Currency
}) {
  const { isSwapTokenSelectorOpen, swapOutputChainId } = useUniswapContext()
  const media = useMedia()

  const isExplorePage = useIsPage(PageType.EXPLORE)
  const isModeMismatch = useIsModeMismatch(initialInputChainId)
  const isSharedSwapDisabled = isModeMismatch && isExplorePage

  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const hasInjectedWallets = useHasInjectedWallets()
  const { walletAddress: embeddedWalletAddress } = useEmbeddedWalletState()
  const showGetStarted = isEmbeddedWalletEnabled && !hasInjectedWallets && !embeddedWalletAddress

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
    selectingCurrencyChainId: swapOutputChainId,
    skipFocusOnCurrencyField: isMobileWeb,
    filteredChainIdsOverride: {
      [CurrencyField.INPUT]: initialInputChainId,
      [CurrencyField.OUTPUT]: initialOutputChainId,
    },
  })

  return (
    <TokenSelectorHoverConfigProvider wrapTokenRow={media.xl ? undefined : wrapWithTokenHoverCard}>
      <ShowGetStartedProvider value={showGetStarted}>
        <MultichainContextProvider initialChainId={initialInputChainId ?? UniverseChainId.Mainnet}>
          <SwapTransactionSettingsStoreContextProvider>
            <SwapAndLimitContextProvider
              initialInputCurrency={initialInputCurrency}
              initialOutputCurrency={initialOutputCurrency}
            >
              <SwapFormStoreContextProvider prefilledState={prefilledState} hideFooter={hideFooter}>
                <Flex position="relative" gap="$spacing16" opacity={isSharedSwapDisabled ? 0.6 : 1}>
                  {isSharedSwapDisabled && <DisabledSwapOverlay />}
                  <UniversalSwapFlow
                    hideHeader={hideHeader}
                    hideFooter={hideFooter}
                    hideChart={hideChart}
                    syncTabToUrl={syncTabToUrl}
                    swapRedirectCallback={swapRedirectCallback}
                    onCurrencyChange={onCurrencyChange}
                    prefilledState={prefilledState}
                    tokenColor={tokenColor}
                    tdpCurrency={tdpCurrency}
                  />
                </Flex>
              </SwapFormStoreContextProvider>
            </SwapAndLimitContextProvider>
          </SwapTransactionSettingsStoreContextProvider>
        </MultichainContextProvider>
      </ShowGetStartedProvider>
    </TokenSelectorHoverConfigProvider>
  )
}

const SWAP_TABS = [SwapTab.Swap, SwapTab.Limit, SwapTab.Buy, SwapTab.Sell]

const TAB_TYPE_TO_LABEL = {
  [SwapTab.Swap]: (t: AppTFunction) => t('swap.form.header'),
  [SwapTab.Limit]: (t: AppTFunction) => t('swap.limit'),
  [SwapTab.Send]: (t: AppTFunction) => t('send.title'),
  [SwapTab.Buy]: (t: AppTFunction) => t('common.buy.label'),
  [SwapTab.Sell]: (t: AppTFunction) => t('common.sell.label'),
}

const PATHNAME_TO_TAB: { [key: string]: SwapTab } = {
  '/swap': SwapTab.Swap,
  '/limit': SwapTab.Limit,
  '/buy': SwapTab.Buy,
  '/sell': SwapTab.Sell,
}

const CHART_CARD_HEIGHT = 288
const CHART_CARD_GAP = 24

const CHART_ELIGIBLE_TABS = new Set<SwapTab>([SwapTab.Swap, SwapTab.Limit])

function isChartEligibleTab(tab: SwapTab): boolean {
  return CHART_ELIGIBLE_TABS.has(tab)
}

function UniversalSwapFlow({
  hideHeader = false,
  hideFooter = false,
  hideChart = false,
  disableTokenInputs = false,
  syncTabToUrl = true,
  prefilledState,
  onCurrencyChange,
  swapRedirectCallback,
  tokenColor,
  tdpCurrency,
}: {
  hideHeader?: boolean
  hideFooter?: boolean
  hideChart?: boolean
  syncTabToUrl?: boolean
  disableTokenInputs?: boolean
  prefilledState?: SwapFormState
  onCurrencyChange?: (selected: CurrencyState, isBridgePair?: boolean) => void
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
  /** When Swap is embedded in TDP, the TDP token currency for Buy/Sell prefill */
  tdpCurrency?: Currency
}) {
  const { currentTab, setCurrentTab } = useSwapAndLimitContext()
  const tdpCurrencyAsset = currencyToAsset(tdpCurrency)
  const { inputCurrency, outputCurrency } = useSlideoutChartCardCurrencies()
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  const [showChart, setShowChart] = useState(false)
  const [tabsRowHeight, setTabsRowHeight] = useState(0)
  const [swapFlowPanelsHeight, setSwapFlowPanelsHeight] = useState(0)
  const onCurrencyPanelsLayout = useCallback((height: number) => setSwapFlowPanelsHeight(height), [])
  const media = useMedia()

  useEffect(() => {
    if (media.lg) {
      setShowChart(false)
    }
  }, [media.lg])

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const LimitFormWrapper = useDeferredComponent(() =>
    import('~/pages/Swap/Limit/LimitForm').then((module) => ({
      default: module.LimitFormWrapper,
    })),
  )
  const BuyForm = useDeferredComponent(() =>
    import('~/pages/Swap/Buy/BuyForm').then((module) => ({
      default: module.BuyForm,
    })),
  )

  const { openModal: openSendFormModal } = useModalState(ModalName.Send)

  useEffect(() => {
    if (pathname === '/send') {
      setCurrentTab(SwapTab.Swap)
      // Do not open the send modal if iFramed (we do not allow the send tab to be iFramed due to clickjacking protections)
      // https://www.notion.so/uniswaplabs/What-is-not-allowed-to-be-iFramed-Clickjacking-protections-874f85f066c648afa0eb3480b3f47b5c#d0ebf1846c83475a86342a594f77eae5
      if (!isIFramed()) {
        openSendFormModal()
      }
    } else {
      const tab = PATHNAME_TO_TAB[pathname] ?? SwapTab.Swap
      setCurrentTab(tab)
      if (!isChartEligibleTab(tab)) {
        setShowChart(false)
      }
    }
  }, [pathname, openSendFormModal, setCurrentTab])

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent(InterfaceEventName.SwapTabClicked, { tab })
      if (!isChartEligibleTab(tab)) {
        setShowChart(false)
      }
      if (syncTabToUrl) {
        navigate(`/${tab}`, { replace: true })
      } else {
        setCurrentTab(tab)
      }
    },
    [navigate, syncTabToUrl, setCurrentTab],
  )

  const isChartVisible = showChart && isChartEligibleTab(currentTab)

  const chartSettingsLeftContent = useMemo(() => {
    if (!isDataLivelinessEnabled || media.lg || hideChart) {
      return undefined
    }
    return (
      <SwapChartToggleButton
        showChart={showChart}
        onPress={() => {
          const next = !showChart
          sendAnalyticsEvent(InterfaceEventName.SlideoutChartCardToggled, {
            is_open: next,
            tab: currentTab,
            token_in_symbol: inputCurrency?.symbol,
            token_in_chain_id: inputCurrency?.chainId,
            token_in_chain_name: inputCurrency ? getChainLabel(inputCurrency.chainId as UniverseChainId) : undefined,
            token_out_symbol: outputCurrency?.symbol,
            token_out_chain_id: outputCurrency?.chainId,
            token_out_chain_name: outputCurrency ? getChainLabel(outputCurrency.chainId as UniverseChainId) : undefined,
          })
          setShowChart(next)
        }}
      />
    )
  }, [isDataLivelinessEnabled, media.lg, showChart, hideChart, currentTab, inputCurrency, outputCurrency])

  const SWAP_TAB_OPTIONS: readonly SegmentedControlOption<SwapTab>[] = useMemo(() => {
    return SWAP_TABS.map((tab) => ({
      value: tab,
      // Use href for proper link semantics when syncing to URL (SEO, accessibility, right-click menu)
      href: syncTabToUrl ? `/${tab}` : undefined,
      display: (
        <Text
          variant="buttonLabel3"
          hoverStyle={{ color: '$neutral1' }}
          color={currentTab === tab ? '$neutral1' : '$neutral2'}
        >
          {TAB_TYPE_TO_LABEL[tab](t)}
        </Text>
      ),
    }))
  }, [t, currentTab, syncTabToUrl])

  return (
    <Flex row alignItems="flex-start" maxWidth="calc(100vw - 16px)">
      {/* Chart card animates in from the left (gated behind DataLivelinessUI flag).
          Not mounted on pages that hide the header (e.g. landing page) since the chart
          toggle lives in the header and the collapsed animator would still consume gap space.
          Also not shown when hideChart is set (e.g. TDP embedded swap). */}
      {isDataLivelinessEnabled && !hideHeader && !hideChart && (
        <WidthAnimator
          open={isChartVisible}
          height={swapFlowPanelsHeight || CHART_CARD_HEIGHT}
          mt={tabsRowHeight}
          contentWidth={PAGE_WRAPPER_MAX_WIDTH + CHART_CARD_GAP}
          $platform-web={{ flexShrink: 1, minWidth: 0 }}
        >
          <Flex width="100%" height="100%" pr="$spacing24">
            <SlideoutChartCard isChartOpen={isChartVisible} />
          </Flex>
        </WidthAnimator>
      )}

      <SwapModuleWrapper $platform-web={{ flexShrink: 1, minWidth: 0 }}>
        {!hideHeader && (
          <Flex
            row
            alignItems="center"
            justifyContent="space-between"
            onLayout={(e) => setTabsRowHeight(e.nativeEvent.layout.height)}
          >
            <SegmentedControl
              outlined={false}
              size="large"
              options={SWAP_TAB_OPTIONS}
              selectedOption={currentTab}
              onSelectOption={onTabClick}
              gap={isMobileWeb ? '$spacing8' : undefined}
            />
            <Flex row gap="$spacing8" alignItems="center">
              {isChartEligibleTab(currentTab) && chartSettingsLeftContent}
              {currentTab === SwapTab.Swap && <SwapFormSettingsButton />}
            </Flex>
          </Flex>
        )}
        {currentTab === SwapTab.Swap && (
          <SwapForm
            hideHeader={hideHeader}
            hideFooter={hideFooter}
            onCurrencyChange={onCurrencyChange}
            prefilledState={prefilledState}
            swapRedirectCallback={swapRedirectCallback}
            tokenColor={tokenColor}
            onCurrencyPanelsLayout={isDataLivelinessEnabled ? onCurrencyPanelsLayout : undefined}
          />
        )}
        {currentTab === SwapTab.Limit && LimitFormWrapper && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
        {currentTab === SwapTab.Buy && BuyForm && (
          <BuyForm
            rampDirection={RampDirection.ON_RAMP}
            disabled={disableTokenInputs}
            initialCurrency={tdpCurrencyAsset ?? prefilledState?.output}
          />
        )}
        {currentTab === SwapTab.Sell && BuyForm && (
          <BuyForm
            rampDirection={RampDirection.OFF_RAMP}
            disabled={disableTokenInputs}
            initialCurrency={tdpCurrencyAsset ?? prefilledState?.output}
          />
        )}
      </SwapModuleWrapper>
    </Flex>
  )
}

const DisabledOverlay = styled(Flex, {
  position: 'absolute',
  width: '100%',
  height: '100%',
  zIndex: zIndexes.overlay,
})

const disabledSwapOverlayTooltipZIndex = stackingLayerAbove(zIndexes.overlay, zIndexes.tooltip)

const DisabledSwapOverlay = () => {
  const { t } = useTranslation()

  return (
    <DisabledOverlay cursor="not-allowed">
      <Tooltip placement="left-start">
        <Tooltip.Content animationDirection="left" zIndex={disabledSwapOverlayTooltipZIndex}>
          <Tooltip.Arrow />
          <Text variant="body4">{t('testnet.unsupported')}</Text>
        </Tooltip.Content>
        <Tooltip.Trigger position="relative" width="100%" height="100%">
          <DisabledOverlay />
        </Tooltip.Trigger>
      </Tooltip>
    </DisabledOverlay>
  )
}
