import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import type { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { SwapBottomCard } from 'components/SwapBottomCard'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { PageWrapper } from 'components/swap/styled'
import { useAccount } from 'hooks/useAccount'
import { useDeferredComponent } from 'hooks/useDeferredComponent'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useModalState } from 'hooks/useModalState'
import { useResetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useWebSwapSettings } from 'pages/Swap/settings/useWebSwapSettings'
import { TDPContext } from 'pages/TokenDetails/TDPContext'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useSwapHandlers } from 'state/sagas/transactions/useSwapHandlers'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import type { CurrencyState } from 'state/swap/types'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import type { SegmentedControlOption } from 'ui/src'
import { Flex, SegmentedControl, styled, Text, Tooltip } from 'ui/src'
import type { AppTFunction } from 'ui/src/i18n/types'
import { zIndexes } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
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
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow/SwapFlow'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/state/selectors'
import { SwapDependenciesStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContextProvider'
import { SwapFormStoreContextProvider } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/SwapFormStoreContextProvider'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { TransactionState } from 'uniswap/src/features/transactions/types/transactionState'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isMobileWeb } from 'utilities/src/platform'
import { noop } from 'utilities/src/react/noop'
import { isIFramed } from 'utils/isIFramed'

export default function SwapPage() {
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
            usePersistedFilteredChainIds
          />
        </WebFORNudgeProvider>
      </PageWrapper>
      {location.pathname === '/swap' && <SwitchLocaleLink />}
    </Trace>
  )
}

// If there are persisted filtered chain ids, use them. Otherwise, use the initial input and output chain ids derived from query params.
function getFilteredChainIdsOverride({
  initialInputChainId,
  initialOutputChainId,
  usePersistedFilteredChainIds,
  persistedFilteredChainIds,
}: {
  initialInputChainId?: UniverseChainId
  initialOutputChainId?: UniverseChainId
  usePersistedFilteredChainIds?: boolean
  persistedFilteredChainIds?: { [key in CurrencyField]?: UniverseChainId }
}): TransactionState['filteredChainIdsOverride'] {
  return usePersistedFilteredChainIds && !!persistedFilteredChainIds
    ? persistedFilteredChainIds
    : { [CurrencyField.OUTPUT]: initialOutputChainId, [CurrencyField.INPUT]: initialInputChainId }
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
  onCurrencyChange,
  syncTabToUrl,
  swapRedirectCallback,
  tokenColor,
  usePersistedFilteredChainIds = false,
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
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
  usePersistedFilteredChainIds?: boolean
  passkeyAuthStatus?: PasskeyAuthStatus
}) {
  const { isSwapTokenSelectorOpen, swapOutputChainId } = useUniswapContext()

  const isExplorePage = useIsPage(PageType.EXPLORE)
  const isModeMismatch = useIsModeMismatch(initialInputChainId)
  const isSharedSwapDisabled = isModeMismatch && isExplorePage

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
    selectingCurrencyChainId: swapOutputChainId,
    skipFocusOnCurrencyField: isMobileWeb,
    filteredChainIdsOverride: getFilteredChainIdsOverride({
      initialInputChainId,
      initialOutputChainId,
      usePersistedFilteredChainIds,
      persistedFilteredChainIds,
    }),
  })

  return (
    <MultichainContextProvider initialChainId={initialInputChainId ?? UniverseChainId.Mainnet}>
      <SwapTransactionSettingsStoreContextProvider>
        <SwapAndLimitContextProvider
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
        >
          <PrefetchBalancesWrapper>
            <SwapFormStoreContextProvider
              prefilledState={prefilledState}
              hideSettings={hideHeader}
              hideFooter={hideFooter}
            >
              <Flex position="relative" gap="$spacing16" opacity={isSharedSwapDisabled ? 0.6 : 1}>
                {isSharedSwapDisabled && <DisabledSwapOverlay />}
                <UniversalSwapFlow
                  hideHeader={hideHeader}
                  hideFooter={hideFooter}
                  syncTabToUrl={syncTabToUrl}
                  swapRedirectCallback={swapRedirectCallback}
                  onCurrencyChange={onCurrencyChange}
                  prefilledState={prefilledState}
                  tokenColor={tokenColor}
                />
              </Flex>
            </SwapFormStoreContextProvider>
          </PrefetchBalancesWrapper>
        </SwapAndLimitContextProvider>
      </SwapTransactionSettingsStoreContextProvider>
    </MultichainContextProvider>
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

function UniversalSwapFlow({
  hideHeader = false,
  hideFooter = false,
  disableTokenInputs = false,
  syncTabToUrl = true,
  prefilledState,
  onCurrencyChange,
  swapRedirectCallback,
  tokenColor,
}: {
  hideHeader?: boolean
  hideFooter?: boolean
  syncTabToUrl?: boolean
  disableTokenInputs?: boolean
  prefilledState?: SwapFormState
  onCurrencyChange?: (selected: CurrencyState, isBridgePair?: boolean) => void
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
}) {
  const { currentTab, setCurrentTab } = useSwapAndLimitContext()

  // Get TDP currency if available (will be null if not in TDP context)
  const tdpCurrency = currencyToAsset(useContext(TDPContext)?.currency)

  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const swapHandlers = useSwapHandlers()

  const LimitFormWrapper = useDeferredComponent(() =>
    import('pages/Swap/Limit/LimitForm').then((module) => ({
      default: module.LimitFormWrapper,
    })),
  )
  const BuyForm = useDeferredComponent(() =>
    import('pages/Swap/Buy/BuyForm').then((module) => ({
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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      setCurrentTab(PATHNAME_TO_TAB[pathname] ?? SwapTab.Swap)
    }
  }, [pathname, openSendFormModal, setCurrentTab])

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent(InterfaceEventName.SwapTabClicked, { tab })
      if (syncTabToUrl) {
        navigate(`/${tab}`, { replace: true })
      } else {
        setCurrentTab(tab)
      }
    },
    [navigate, syncTabToUrl, setCurrentTab],
  )

  const isFiatOffRampEnabled = useFeatureFlag(FeatureFlags.FiatOffRamp)
  const SWAP_TAB_OPTIONS: readonly SegmentedControlOption<SwapTab>[] = useMemo(() => {
    return SWAP_TABS.filter((tab) => {
      if (tab === SwapTab.Sell && !isFiatOffRampEnabled) {
        return false
      }

      return true
    }).map((tab) => ({
      value: tab,
      display: (
        <Text
          variant="buttonLabel3"
          hoverStyle={{ color: '$neutral1' }}
          color={currentTab === tab ? '$neutral1' : '$neutral2'}
          tag="h1"
        >
          {TAB_TYPE_TO_LABEL[tab](t)}
        </Text>
      ),
    }))
  }, [t, currentTab, isFiatOffRampEnabled])

  const swapSettings = useWebSwapSettings()
  const resetDisableOneClickSwap = useResetOverrideOneClickSwapFlag()

  const connectorId = useAccount().connector?.id
  const passkeyAuthStatus = useGetPasskeyAuthStatus(connectorId)

  return (
    <Flex>
      {!hideHeader && (
        <Flex row gap="$spacing16">
          <SegmentedControl
            outlined={false}
            size="large"
            options={SWAP_TAB_OPTIONS}
            selectedOption={currentTab}
            onSelectOption={onTabClick}
            gap={isMobileWeb ? '$spacing8' : undefined}
          />
        </Flex>
      )}
      {currentTab === SwapTab.Swap && (
        <Flex gap="$spacing16">
          <SwapDependenciesStoreContextProvider swapHandlers={swapHandlers}>
            <SwapFlow
              settings={swapSettings}
              hideHeader={hideHeader}
              hideFooter={hideFooter}
              onClose={noop}
              swapRedirectCallback={swapRedirectCallback}
              onCurrencyChange={onCurrencyChange}
              prefilledState={prefilledState}
              tokenColor={tokenColor}
              onSubmitSwap={resetDisableOneClickSwap}
              passkeyAuthStatus={passkeyAuthStatus}
            />
          </SwapDependenciesStoreContextProvider>
          <SwapBottomCard />
        </Flex>
      )}
      {currentTab === SwapTab.Limit && LimitFormWrapper && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
      {currentTab === SwapTab.Buy && BuyForm && (
        <BuyForm
          rampDirection={RampDirection.ONRAMP}
          disabled={disableTokenInputs}
          initialCurrency={tdpCurrency ?? prefilledState?.output}
        />
      )}
      {currentTab === SwapTab.Sell && BuyForm && (
        <BuyForm
          rampDirection={RampDirection.OFFRAMP}
          disabled={disableTokenInputs}
          initialCurrency={tdpCurrency ?? prefilledState?.output}
        />
      )}
    </Flex>
  )
}

const DisabledOverlay = styled(Flex, {
  position: 'absolute',
  width: '100%',
  height: '100%',
  zIndex: zIndexes.overlay,
})

const DisabledSwapOverlay = () => {
  const { t } = useTranslation()

  return (
    <DisabledOverlay cursor="not-allowed">
      <Tooltip placement="left-start">
        <Tooltip.Content animationDirection="left">
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
