import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { SwapBottomCard } from 'components/SwapBottomCard'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { PageWrapper } from 'components/swap/styled'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { BuyForm } from 'pages/Swap/Buy/BuyForm'
import { LimitFormWrapper } from 'pages/Swap/Limit/LimitForm'
import { SendForm } from 'pages/Swap/Send/SendForm'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { Flex, SegmentedControl, SegmentedControlOption, Text, Tooltip, styled } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { zIndexes } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { SwapRedirectFn } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/settings/slice'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow'
import { SwapFormContextProvider, SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline'
import { ProtocolPreference } from 'uniswap/src/features/transactions/swap/settings/configs/ProtocolPreference'
import { Slippage } from 'uniswap/src/features/transactions/swap/settings/configs/Slippage'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isMobileWeb } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'
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
    initialChainId,
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
    <Trace logImpression page={InterfacePageName.SWAP_PAGE}>
      <PageWrapper>
        <Swap
          chainId={initialChainId}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
          initialTypedValue={initialTypedValue}
          initialIndependentField={initialField}
          syncTabToUrl={true}
        />
      </PageWrapper>
      {location.pathname === '/swap' && <SwitchLocaleLink />}
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
  initialTypedValue,
  initialIndependentField,
  chainId,
  hideHeader = false,
  hideFooter = false,
  onCurrencyChange,
  syncTabToUrl,
  swapRedirectCallback,
  tokenColor,
}: {
  chainId?: UniverseChainId
  onCurrencyChange?: (selected: CurrencyState) => void
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialIndependentField?: CurrencyField
  syncTabToUrl: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  swapRedirectCallback?: SwapRedirectFn
  tokenColor?: string
}) {
  const isExplorePage = useIsPage(PageType.EXPLORE)

  const { isTestnetModeEnabled } = useEnabledChains()
  const isSharedSwapDisabled = isTestnetModeEnabled && isExplorePage

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const { isSwapTokenSelectorOpen, swapOutputChainId } = useUniswapContext()

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
    selectingCurrencyChainId: swapOutputChainId,
    skipFocusOnCurrencyField: isMobileWeb,
  })

  return (
    <MultichainContextProvider initialChainId={chainId}>
      <TransactionSettingsContextProvider settingKey={TransactionSettingKey.Swap}>
        <SwapAndLimitContextProvider
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
        >
          <PrefetchBalancesWrapper>
            <SwapFormContextProvider prefilledState={prefilledState} hideSettings={hideHeader} hideFooter={hideFooter}>
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
            </SwapFormContextProvider>
          </PrefetchBalancesWrapper>
        </SwapAndLimitContextProvider>
      </TransactionSettingsContextProvider>
    </MultichainContextProvider>
  )
}

const SWAP_TABS = [SwapTab.Swap, SwapTab.Limit, SwapTab.Send, SwapTab.Buy]

const TAB_TYPE_TO_LABEL = {
  [SwapTab.Swap]: (t: AppTFunction) => t('swap.form.header'),
  [SwapTab.Limit]: (t: AppTFunction) => t('swap.limit'),
  [SwapTab.Send]: (t: AppTFunction) => t('send.title'),
  [SwapTab.Buy]: (t: AppTFunction) => t('common.buy.label'),
}

const PATHNAME_TO_TAB: { [key: string]: SwapTab } = {
  '/swap': SwapTab.Swap,
  '/send': SwapTab.Send,
  '/limit': SwapTab.Limit,
  '/buy': SwapTab.Buy,
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
  const [currentTab, setCurrentTab] = useState(SwapTab.Swap)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  useEffect(() => {
    if (pathname === '/send' && isIFramed()) {
      // Redirect to swap if send tab is iFramed (we do not allow the send tab to be iFramed due to clickjacking protections)
      // https://www.notion.so/uniswaplabs/What-is-not-allowed-to-be-iFramed-Clickjacking-protections-874f85f066c648afa0eb3480b3f47b5c#d0ebf1846c83475a86342a594f77eae5
      setCurrentTab(SwapTab.Swap)
    } else {
      setCurrentTab(PATHNAME_TO_TAB[pathname] ?? SwapTab.Swap)
    }
  }, [pathname, setCurrentTab])

  const onTabClick = useCallback(
    (tab: SwapTab) => {
      sendAnalyticsEvent(InterfaceEventNameLocal.SwapTabClicked, { tab })
      if (syncTabToUrl) {
        navigate(`/${tab}`, { replace: true })
      } else {
        setCurrentTab(tab)
      }
    },
    [navigate, syncTabToUrl, setCurrentTab],
  )

  const SWAP_TAB_OPTIONS: readonly SegmentedControlOption<SwapTab>[] = useMemo(() => {
    return SWAP_TABS.filter((tab) => !(isIFramed() && tab === SwapTab.Send)).map((tab) => ({
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
  }, [t, currentTab])

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
          <SwapFlow
            settings={[Slippage, Deadline, ProtocolPreference]}
            hideHeader={hideHeader}
            hideFooter={hideFooter}
            onClose={noop}
            swapRedirectCallback={swapRedirectCallback}
            onCurrencyChange={onCurrencyChange}
            swapCallback={swapCallback}
            wrapCallback={wrapCallback}
            prefilledState={prefilledState}
            tokenColor={tokenColor}
          />
          <SwapBottomCard />
        </Flex>
      )}
      {currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
      {currentTab === SwapTab.Send && (
        <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
      )}
      {currentTab === SwapTab.Buy && <BuyForm disabled={disableTokenInputs} initialCurrency={prefilledState?.output} />}
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
        <Tooltip.Content>
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
