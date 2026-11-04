import type { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { useEmbeddedWalletState } from '@universe/embedded-wallet'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag, useFeatureFlagWithLoading } from '@universe/gating'
/* oxlint-disable max-lines */
import { Flex, Text, Tooltip, zIndexes } from '@universe/mycelium'
import { FlexCompat, type FlexCompatProps } from '@universe/mycelium/flex-compat'
import type { SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { WidthAnimator } from '@universe/mycelium/width-animator'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { stackingLayerAbove } from 'ui/src'
import { TokenSelectorHoverConfigProvider } from 'uniswap/src/components/TokenSelector/TokenSelectorHoverConfig'
import { ShowGetStartedProvider } from 'uniswap/src/contexts/ShowGetStartedContext'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { WebFORNudgeProvider } from 'uniswap/src/features/providers/webForNudgeProvider'
import type { AddFundsPressParams } from 'uniswap/src/features/providers/webForNudgeTypes'
import { InterfaceEventName, InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SwapTransactionSettingsStoreContextProvider } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/SwapTransactionSettingsStoreContextProvider'
import type {
  PasskeyAuthStatus,
  SwapRedirectFn,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { MarginFormStoreContextProvider } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContextProvider'
import { useMarginFormStoreBase } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import type { AppTFunction } from 'utilities/src/i18n/types'
import { AccountDrawer } from '~/components/AccountDrawer'
import { TokenHoverCard } from '~/components/HoverCard/TokenHoverCard/TokenHoverCard'
import { Portal } from '~/components/Popups/Portal'
import { useAccount } from '~/connection/hooks/useAccount'
import { useHasInjectedWallets } from '~/connection/hooks/useOrderedWalletConnectors'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import { SwapAndLimitContextProvider } from '~/features/Swap/state/SwapContext'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useSwapAndLimitContext } from '~/features/Swap/state/useSwapContext'
import { PAGE_WRAPPER_MAX_WIDTH, PageWrapper, SwapModuleWrapper } from '~/features/Swap/styled'
import { useDeferredComponent } from '~/hooks/useDeferredComponent'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { useModalState } from '~/hooks/useModalState'
import { useEmbedView } from '~/pages/Swap/embedContext'
import { usePermissionedSwap } from '~/pages/Swap/hooks/usePermissionedSwap'
import { useMarginViewTransition } from '~/pages/Swap/Margin/marginMorph'
import {
  MARGIN_FORM_RAIL_WIDTH,
  MARGIN_TERMINAL_TOP_PADDING,
  MarginTerminalLayout,
  isMarginTerminalReady,
  useIsMarginTerminal,
  useMarginMorphAnimation,
} from '~/pages/Swap/Margin/MarginTerminalLayout'
import { buildSwapTabOptions, isTabPermissionedBlocked } from '~/pages/Swap/permissionedTabs'
import { PermissionedTabWrapper } from '~/pages/Swap/PermissionedTabWrapper'
import { ReturnToAuctionBanner } from '~/pages/Swap/ReturnToAuctionBanner'
import { SlideoutChartCard } from '~/pages/Swap/Swap/SlideoutChartCard/SlideoutChartCard'
import { useSlideoutChartCardCurrencies } from '~/pages/Swap/Swap/SlideoutChartCard/useSlideoutChartCardCurrencies'
import { useInitialCurrencyState } from '~/pages/Swap/Swap/state/hooks'
import { SwapChartToggleButton } from '~/pages/Swap/Swap/SwapChartToggleButton'
import { SwapForm } from '~/pages/Swap/Swap/SwapForm'
import { getSwapCapabilities } from '~/pages/Swap/swapCapabilities'
import { SwapHeaderTabRow } from '~/pages/Swap/SwapHeaderTabRow'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
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
  // Reported by the rendered view rather than derived from the route, so the padding switches with the
  // margin cross-fade, under the same gate.
  const [isTerminalView, setIsTerminalView] = useState(false)
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  const dispatch = useAppDispatch()
  const openAddFundsModal = useCallback(
    (initialState: AddFundsPressParams) => dispatch(setOpenModal({ name: ModalName.AddFunds, initialState })),
    [dispatch],
  )

  // Same shared SwapPage for every surface. The embed `view` (from context) picks the
  // capabilities so the swap-only surface (`/embed?view=swap`) can strip itself instead of
  // forking into a separate component tree. Outside an embed, view is 'full' → no change.
  const capabilities = getSwapCapabilities(useEmbedView())

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
      <PageWrapper
        // Only override padding in the full-screen terminal; otherwise inherit
        // PageWrapper's responsive defaults ($spacing60/$lg/$md). Passing an
        // explicit `undefined` would clobber those defaults and flatten the
        // header→module gap on every non-terminal tab (swap/limit/buy/sell).
        {...(isTerminalView ? { pt: MARGIN_TERMINAL_TOP_PADDING, px: '$none', pb: '$none' } : {})}
      >
        <WebFORNudgeProvider onAddFundsPress={isNewUserUxEnabled ? openAddFundsModal : undefined}>
          <Swap
            initialInputChainId={initialInputChainId}
            initialInputCurrency={initialInputCurrency}
            initialOutputCurrency={initialOutputCurrency}
            initialOutputChainId={initialOutputChainId}
            initialTypedValue={initialTypedValue}
            initialIndependentField={initialField}
            hideHeader={!capabilities.header}
            hideChart={!capabilities.chart}
            syncTabToUrl={capabilities.syncTabToUrl}
            onTerminalViewChange={setIsTerminalView}
          />
        </WebFORNudgeProvider>
      </PageWrapper>
      {capabilities.appChrome ? (
        <ReturnToAuctionBanner />
      ) : (
        // Swap-only surface renders no app chrome, so mount the AccountDrawer here (as in
        // #35715) — connecting a wallet still needs it. Send/embedded-wallet frame-bust as usual.
        <Portal>
          <AccountDrawer />
        </Portal>
      )}
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
  onTerminalViewChange,
}: {
  initialInputChainId?: UniverseChainId
  onCurrencyChange?: (selected: CurrencyState, selectedCurrency?: Currency) => void
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
  onTerminalViewChange?: (isTerminalView: boolean) => void
}) {
  const { isSwapTokenSelectorOpen, swapOutputChainId } = useUniswapContext()
  const media = useMedia()
  const location = useLocation()

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
              initialTab={syncTabToUrl ? PATHNAME_TO_TAB[location.pathname] : undefined}
            >
              <SwapFormStoreContextProvider prefilledState={prefilledState} hideFooter={hideFooter}>
                {/* Hoisted above UniversalSwapFlow so margin form state survives the terminal
                    morph and the 1024px breakpoint switch; margin-inert on other tabs. */}
                <MarginFormStoreContextProvider>
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
                      onTerminalViewChange={onTerminalViewChange}
                    />
                  </Flex>
                </MarginFormStoreContextProvider>
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
  [SwapTab.Margin]: (t: AppTFunction) => t('margin.tab.label'),
}

const PATHNAME_TO_TAB: { [key: string]: SwapTab } = {
  '/swap': SwapTab.Swap,
  '/limit': SwapTab.Limit,
  '/buy': SwapTab.Buy,
  '/sell': SwapTab.Sell,
  '/margin': SwapTab.Margin,
}

const CHART_CARD_HEIGHT = 288
const CHART_CARD_GAP = 24

const CHART_ELIGIBLE_TABS = new Set<SwapTab>([SwapTab.Swap, SwapTab.Limit])

function isChartEligibleTab(tab: SwapTab): boolean {
  return CHART_ELIGIBLE_TABS.has(tab)
}

// oxlint-disable-next-line complexity -- tab dispatcher (swap/limit/buy/sell/margin) + chart + margin side-panel
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
  onTerminalViewChange,
}: {
  hideHeader?: boolean
  hideFooter?: boolean
  hideChart?: boolean
  syncTabToUrl?: boolean
  disableTokenInputs?: boolean
  prefilledState?: SwapFormState
  onCurrencyChange?: (selected: CurrencyState, selectedCurrency?: Currency) => void
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
  /** When Swap is embedded in TDP, the TDP token currency for Buy/Sell prefill */
  tdpCurrency?: Currency
  onTerminalViewChange?: (isTerminalView: boolean) => void
}) {
  const { currentTab, setCurrentTab, currencyState } = useSwapAndLimitContext()
  const tdpCurrencyAsset = currencyToAsset(tdpCurrency)
  const { inputCurrency, outputCurrency } = useSlideoutChartCardCurrencies()
  const { value: isMarginEnabled, isLoading: marginFlagLoading } = useFeatureFlagWithLoading(FeatureFlags.Margin)
  const [showChart, setShowChart] = useState(false)
  const [tabsRowHeight, setTabsRowHeight] = useState(0)
  const [swapFlowPanelsHeight, setSwapFlowPanelsHeight] = useState(0)
  const onCurrencyPanelsLayout = useCallback((height: number) => setSwapFlowPanelsHeight(height), [])
  const media = useMedia()
  const account = useAccount()
  const isTerminal = useIsMarginTerminal()
  // Morph motion only after a user tab click — never on first paint / deep link. State rather than a
  // ref because it is READ DURING RENDER (passed to MarginTerminalLayout and used in an inline style):
  // a ref write is invisible to React, and this only worked because onTabClick happens to navigate or
  // setCurrentTab immediately after. It flips at most once per mount, so the extra render is free.
  const [hasInteracted, setHasInteracted] = useState(false)
  const animateMorph = useMarginMorphAnimation(hasInteracted)
  // The rendered view lags the live tab/terminal state through the margin cross-fade: the swap view
  // holds while it fades out, then the margin view mounts and fades in. Non-margin tabs commit at once.
  const { viewRef, formRef, chartRef, displayTab, displayIsTerminal } = useMarginViewTransition({
    currentTab,
    isTerminal,
    animateMorph,
  })
  useLayoutEffect(() => {
    onTerminalViewChange?.(displayIsTerminal)
  }, [displayIsTerminal, onTerminalViewChange])
  const marginFormStore = useMarginFormStoreBase()

  // Keyed on the TAB, not on `isTerminal`. isTerminal folds in `!media.xl`, so a resize across the
  // 1024px breakpoint flips it false and back true without the user ever leaving /margin — which would
  // re-send on every crossing and inflate the entry funnel (dragging a window emits repeatedly).
  const hasSentTerminalEnteredRef = useRef(false)
  useEffect(() => {
    if (currentTab !== SwapTab.Margin) {
      hasSentTerminalEnteredRef.current = false
      return
    }
    if (isTerminal && !hasSentTerminalEnteredRef.current) {
      hasSentTerminalEnteredRef.current = true
      sendAnalyticsEvent(InterfaceEventName.MarginTerminalEntered, {
        pairKey: marginFormStore.getState().pairKey,
      })
    }
  }, [isTerminal, currentTab, marginFormStore])

  useEffect(() => {
    if (media.lg) {
      setShowChart(false)
    }
  }, [media.lg])

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Permissioned-token gating — see usePermissionedSwap for the per-side detection details.
  // The Swap CTA + denied-state Dialog are handled in-form by SwapFormWarningModals; this
  // page-level hook is kept for PermissionedTabWrapper (Limit tab overlay). `isLoading`
  // is folded into the overlay gate so tab content doesn't render during the KYC fetch.
  const {
    isPermissionedBlocked,
    isLoading: isPermissionedLoading,
    permissionedTokenSymbol,
  } = usePermissionedSwap(currencyState)

  // Buy/Sell tabs gate against the TDP token so a permissioned asset can't be bought or
  // sold via fiat on/off-ramp partners without verification. Live in-form gating after a
  // quote-currency change is a follow-up; the ramp partner's own KYC catches that case.
  const buySellCurrencyState = useMemo<CurrencyState>(
    () => ({ inputCurrency: tdpCurrency, outputCurrency: undefined }),
    [tdpCurrency],
  )
  const {
    isPermissionedBlocked: isBuySellPermissionedBlocked,
    isLoading: isBuySellPermissionedLoading,
    permissionedTokenSymbol: buySellPermissionedTokenSymbol,
  } = usePermissionedSwap(buySellCurrencyState)

  // Single source for each tab's gate so the tab button (isTabBlocked) and the content overlay
  // (PermissionedTabWrapper isBlocked) can't drift if the condition gains a term later. Fold
  // `isLoading` in so neither the tab nor its content unlocks during the KYC fetch.
  const limitTabBlocked = isPermissionedBlocked || isPermissionedLoading
  const buySellTabBlocked = isBuySellPermissionedBlocked || isBuySellPermissionedLoading

  const LimitFormWrapper = useDeferredComponent({
    importFn: () =>
      import('~/pages/Swap/Limit/LimitForm').then((module) => ({
        default: module.LimitFormWrapper,
      })),
  })
  const BuyForm = useDeferredComponent({
    importFn: () =>
      import('~/pages/Swap/Buy/BuyForm').then((module) => ({
        default: module.BuyForm,
      })),
  })
  // The four margin panes stay off the wire entirely while the flag is off — including
  // lightweight-charts, which rides MarginChartPane.
  const MarginForm = useDeferredComponent({
    enabled: isMarginEnabled,
    importFn: () =>
      import('~/pages/Swap/Margin/MarginForm').then((module) => ({
        default: module.MarginForm,
      })),
  })
  const MarginChartPane = useDeferredComponent({
    enabled: isMarginEnabled,
    importFn: () => import('~/pages/Swap/Margin/MarginChartPane').then((m) => ({ default: m.MarginChartPane })),
  })
  // Margin-scoped ⚙︎ popover (slippage only) — deliberately NOT the swap-wide settings UI.
  const MarginSettingsPopover = useDeferredComponent({
    enabled: isMarginEnabled,
    importFn: () =>
      import('~/pages/Swap/Margin/components/MarginRateRows').then((m) => ({ default: m.MarginSettingsPopover })),
  })
  const MarginPositionsTable = useDeferredComponent({
    enabled: isMarginEnabled,
    importFn: () =>
      import('~/pages/Swap/Margin/MarginPositionsTable').then((m) => ({ default: m.MarginPositionsTable })),
  })
  // Phone widths only: the tabbed layout (form / position cards, chart in a sheet) replaces the form
  // with its inline table, whose columns do not fit.
  const isMarginMobile = isMarginEnabled && media.lg
  const MarginMobileLayout = useDeferredComponent({
    enabled: isMarginMobile,
    importFn: () => import('~/pages/Swap/Margin/MarginMobileLayout').then((m) => ({ default: m.MarginMobileLayout })),
  })

  // Preloads markets so the Margin tab opens without the blank below. Only where that tab exists (embeds
  // like the landing hero, TDP and pool details have none), and without polling: the margin panes poll.
  const { isLoading: marginMarketsLoading } = useMarginMarkets({
    enabled: isMarginEnabled && syncTabToUrl,
    poll: false,
  })
  // Keyed on the route so the blank also covers the window before the flag resolves.
  const headingToMarginTerminal = pathname === '/margin' && !media.xl && (marginFlagLoading || isMarginEnabled)
  const marginTerminalReady = isMarginTerminalReady({
    flagLoading: marginFlagLoading,
    isMarginEnabled,
    chunksLoaded: Boolean(MarginChartPane && MarginForm),
    marketsLoading: marginMarketsLoading,
  })

  const { openModal: openSendFormModal } = useModalState(ModalName.Send)

  useEffect(() => {
    if (pathname === '/send') {
      setCurrentTab(SwapTab.Swap)
      // Send is not allowed inside an iframe (clickjacking protections). Instead of
      // silently dropping the action, frame-bust out to the top-level /send so the
      // user can still complete the transfer (params preserved). Mirrors the
      // embedded-wallet/passkey frame-bust (useSignInWithPasskey → isIFramed(true)).
      // https://www.notion.so/uniswaplabs/What-is-not-allowed-to-be-iFramed-Clickjacking-protections-874f85f066c648afa0eb3480b3f47b5c#d0ebf1846c83475a86342a594f77eae5
      if (isIFramed(true, { bustToPath: '/send' })) {
        return
      }
      openSendFormModal()
    } else {
      const tab = PATHNAME_TO_TAB[pathname] ?? SwapTab.Swap
      setCurrentTab(tab)
      if (!isChartEligibleTab(tab)) {
        setShowChart(false)
      }
    }
  }, [pathname, openSendFormModal, setCurrentTab])

  const isTabBlocked = useCallback(
    (tab: SwapTab): boolean =>
      isTabPermissionedBlocked(tab, {
        limitBlocked: limitTabBlocked,
        buySellBlocked: buySellTabBlocked,
      }),
    [limitTabBlocked, buySellTabBlocked],
  )

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      if (isTabBlocked(tab)) {
        return
      }
      setHasInteracted(true)
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
    [navigate, syncTabToUrl, setCurrentTab, isTabBlocked],
  )

  const isChartVisible = showChart && isChartEligibleTab(currentTab)

  const chartSettingsLeftContent = useMemo(() => {
    if (media.lg || hideChart) {
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
  }, [media.lg, showChart, hideChart, currentTab, inputCurrency, outputCurrency])

  const getTabLabel = useCallback((tab: SwapTab) => TAB_TYPE_TO_LABEL[tab](t), [t])
  // Margin only renders where a /margin route exists: flag on and not embedded (syncTabToUrl).
  const swapTabs = useMemo(
    () => (isMarginEnabled && syncTabToUrl ? [...SWAP_TABS, SwapTab.Margin] : SWAP_TABS),
    [isMarginEnabled, syncTabToUrl],
  )

  const SWAP_TAB_OPTIONS: readonly SegmentedControlOption<SwapTab>[] = useMemo(
    () =>
      buildSwapTabOptions({
        tabs: swapTabs,
        currentTab,
        syncTabToUrl,
        getTabLabel,
        isTabBlocked,
      }),
    [getTabLabel, currentTab, syncTabToUrl, isTabBlocked, swapTabs],
  )

  // On wide screens, lift the margin positions panel into a right-side column (form on the left).
  // Gated on a connected wallet so we never reserve an empty column; narrow screens keep it inline.
  const showMarginSidePanel = isMarginEnabled && displayTab === SwapTab.Margin && !media.lg && Boolean(account.address)

  if (headingToMarginTerminal && !marginTerminalReady) {
    return <Flex width="100%" minHeight="calc(100dvh - 120px)" />
  }

  return (
    <MarginTerminalLayout
      isTerminal={displayIsTerminal}
      rootRef={viewRef}
      chartRef={chartRef}
      chartPane={MarginChartPane ? <MarginChartPane /> : null}
      // No wallet, no positions pane: the table renders nothing then, and an empty pane would still take
      // its share of the column from the chart.
      positionsTable={MarginPositionsTable && account.address ? <MarginPositionsTable /> : null}
      nonTerminalChartAnimator={
        // Chart card animates in from the left.
        // Not mounted on pages that hide the header (e.g. landing page) since the chart
        // toggle lives in the header and the collapsed animator would still consume gap space.
        // Also not shown when hideChart is set (e.g. TDP embedded swap).
        !hideHeader && !hideChart ? (
          <WidthAnimator
            open={isChartVisible}
            height={swapFlowPanelsHeight || CHART_CARD_HEIGHT}
            mt={tabsRowHeight}
            contentWidth={PAGE_WRAPPER_MAX_WIDTH + CHART_CARD_GAP}
            styleProps={{ '$platform-web': { flexShrink: 1, minWidth: 0 } }}
          >
            <Flex width="100%" height="100%" pr="$spacing24">
              <SlideoutChartCard isChartOpen={isChartVisible} />
            </Flex>
          </WidthAnimator>
        ) : null
      }
      nonTerminalSidePanel={
        showMarginSidePanel && MarginPositionsTable ? (
          <Flex
            mt={tabsRowHeight}
            ml="$spacing12"
            width={360}
            p="$spacing20"
            borderRadius="$rounded24"
            backgroundColor="$surface1"
            borderWidth="$spacing1"
            borderColor="$surface3"
            $platform-web={{ flexShrink: 0 }}
          >
            <MarginPositionsTable />
          </Flex>
        ) : null
      }
    >
      <SwapModuleWrapper
        ref={formRef}
        width={displayIsTerminal ? MARGIN_FORM_RAIL_WIDTH : PAGE_WRAPPER_MAX_WIDTH}
        // Terminal: pinned rail so only the chart flexes. Non-terminal: still
        // shrinks to make room for the slideout chart card in the narrow band.
        $platform-web={{
          flexShrink: displayIsTerminal ? 0 : 1,
          minWidth: 0,
          // The terminal pins the page to the viewport, so the rail spans the full column height and a
          // form taller than it scrolls inside the rail instead of growing the page.
          ...(displayIsTerminal ? { minHeight: 0, overflowY: 'auto' as const, scrollbarWidth: 'thin' as const } : {}),
        }}
      >
        {!hideHeader && (
          <SwapHeaderTabRow
            options={SWAP_TAB_OPTIONS}
            currentTab={currentTab}
            onTabClick={onTabClick}
            getTabLabel={getTabLabel}
            chartToggle={isChartEligibleTab(currentTab) ? chartSettingsLeftContent : undefined}
            trailingContent={
              currentTab === SwapTab.Margin && MarginSettingsPopover ? <MarginSettingsPopover /> : undefined
            }
            onHeightChange={setTabsRowHeight}
            // Snap only across the margin morph, which would otherwise show the pill sliding under the fade.
            animateIndicator={currentTab !== SwapTab.Margin && displayTab !== SwapTab.Margin}
          />
        )}
        {displayTab === SwapTab.Swap && (
          <SwapForm
            hideHeader={hideHeader}
            hideFooter={hideFooter}
            onCurrencyChange={onCurrencyChange}
            prefilledState={prefilledState}
            swapRedirectCallback={swapRedirectCallback}
            tokenColor={tokenColor}
            tdpCurrency={tdpCurrency}
            onCurrencyPanelsLayout={onCurrencyPanelsLayout}
          />
        )}
        {displayTab === SwapTab.Limit && LimitFormWrapper && (
          <PermissionedTabWrapper isBlocked={limitTabBlocked} tokenSymbol={permissionedTokenSymbol}>
            <LimitFormWrapper onCurrencyChange={onCurrencyChange} />
          </PermissionedTabWrapper>
        )}
        {displayTab === SwapTab.Buy && BuyForm && (
          <PermissionedTabWrapper isBlocked={buySellTabBlocked} tokenSymbol={buySellPermissionedTokenSymbol}>
            <BuyForm
              rampDirection={RampDirection.ON_RAMP}
              disabled={disableTokenInputs}
              initialCurrency={tdpCurrencyAsset ?? prefilledState?.output}
            />
          </PermissionedTabWrapper>
        )}
        {displayTab === SwapTab.Sell && BuyForm && (
          <PermissionedTabWrapper isBlocked={buySellTabBlocked} tokenSymbol={buySellPermissionedTokenSymbol}>
            <BuyForm
              rampDirection={RampDirection.OFF_RAMP}
              disabled={disableTokenInputs}
              initialCurrency={tdpCurrencyAsset ?? prefilledState?.output}
            />
          </PermissionedTabWrapper>
        )}
        {/* VerifyIdentityModal is now mounted in-form via SwapFormWarningModals
            (shared `VerifyIdentityBottomSheet` renders as Dialog on web). */}
        {/* Inline table only when neither the terminal slot nor the side panel already shows it —
            it renders a Connect CTA when disconnected. */}
        {displayTab === SwapTab.Margin && isMarginMobile && MarginMobileLayout && <MarginMobileLayout />}
        {displayTab === SwapTab.Margin && !isMarginMobile && MarginForm && (
          <MarginForm
            showInlinePositions={!showMarginSidePanel && !displayIsTerminal}
            showMarketSelector={!displayIsTerminal}
          />
        )}
      </SwapModuleWrapper>
    </MarginTerminalLayout>
  )
}

// `{...props}` last: the outer usage's `cursor="not-allowed"` must win.
const DisabledOverlay = forwardRef<HTMLElement, FlexCompatProps>(function DisabledOverlay(props, ref) {
  return <FlexCompat ref={ref} position="absolute" width="100%" height="100%" zIndex={zIndexes.overlay} {...props} />
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
