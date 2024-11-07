import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency, Token } from '@uniswap/sdk-core'
import { SwapBottomCard } from 'components/SwapBottomCard'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import SwapHeader, { PathnameToTab } from 'components/swap/SwapHeader'
import { PageWrapper, SwapWrapper } from 'components/swap/styled'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useIsExplorePage } from 'hooks/useIsExplorePage'
import { BuyForm } from 'pages/Swap/Buy/BuyForm'
//import { LimitFormWrapper } from 'pages/Swap/Limit/LimitForm'
import { SendForm } from 'pages/Swap/Send/SendForm'
import { SwapForm } from 'pages/Swap/SwapForm'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import { SwapAndLimitContextProvider, SwapContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext } from 'state/swap/types'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { Flex, SegmentedControl, Text, Tooltip, styled } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { zIndices } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfaceEventNameLocal } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { SwapRedirectFn } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow'
import {
  SwapFormContextProvider,
  SwapFormState,
  useSwapFormContext,
} from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { currencyId } from 'uniswap/src/utils/currencyId'
import noop from 'utilities/src/react/noop'

const WEB_CUSTOM_SWAP_SETTINGS = [Deadline]

export function getIsReviewableQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode,
): boolean {
  if (swapInputError) {
    return false
  }
  // if the current quote is a preview quote, allow the user to progress to the Swap review screen
  if (isPreviewTrade(trade)) {
    return true
  }

  return Boolean(trade && tradeState === TradeState.VALID)
}

export default function SwapPage({ className }: { className?: string }) {
  const location = useLocation()
  // (WEB-4737): Remove this line after completing A/A Test on Web
  useFeatureFlag(FeatureFlags.AATestWeb)

  const {
    initialInputCurrency,
    initialOutputCurrency,
    initialChainId,
    initialTypedValue,
    initialField,
    initialCurrencyLoading,
  } = useInitialCurrencyState()

  return (
    <Trace logImpression page={InterfacePageName.SWAP_PAGE}>
      <PageWrapper>
        <Swap
          className={className}
          chainId={initialChainId}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
          initialTypedValue={initialTypedValue}
          initialIndependentField={initialField}
          initialCurrencyLoading={initialCurrencyLoading}
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
  className,
  initialInputCurrency,
  initialOutputCurrency,
  initialTypedValue,
  initialIndependentField,
  initialCurrencyLoading = false,
  chainId,
  hideHeader = false,
  hideFooter = false,
  onCurrencyChange,
  disableTokenInputs = false,
  compact = false,
  syncTabToUrl,
  swapRedirectCallback,
}: {
  className?: string
  chainId?: UniverseChainId
  onCurrencyChange?: (selected: CurrencyState) => void
  disableTokenInputs?: boolean
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialIndependentField?: CurrencyField
  initialCurrencyLoading?: boolean
  compact?: boolean
  syncTabToUrl: boolean
  multichainUXEnabled?: boolean
  hideHeader?: boolean
  hideFooter?: boolean
  swapRedirectCallback?: SwapRedirectFn
}) {
  const isDark = useIsDarkMode()
  const screenSize = useScreenSize()
  const isExplore = useIsExplorePage()

  // TODO: universal flow uses SwapFlow from @uniswap: max, encoded calls, router need adjusting or revert
  // TODO: instead of using old router with new flow, implement new universal adapter so we can support v4
  //  and trading-api alltogether.
  //const universalSwapFlow = useFeatureFlag(FeatureFlags.UniversalSwap)
  const universalSwapFlow = false
  const { isTestnetModeEnabled } = useEnabledChains()
  const isSharedSwapDisabled = isTestnetModeEnabled && isExplore

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const { isSwapTokenSelectorOpen } = useUniswapContext()

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
  })

  // TODO: use this flow when activating universal router
  if (universalSwapFlow || isTestnetModeEnabled) {
    return (
      <SwapAndLimitContextProvider
        initialChainId={chainId}
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={initialOutputCurrency}
        multichainUXEnabled
      >
        <PrefetchBalancesWrapper>
          <SwapFormContextProvider prefilledState={prefilledState} hideSettings={hideHeader} hideFooter={hideFooter}>
            <Flex position="relative" gap="$spacing16" opacity={isSharedSwapDisabled ? 0.6 : 1}>
              {isSharedSwapDisabled && <DisabledSwapOverlay />}
              <UniversalSwapFlow
                hideHeader={hideHeader}
                hideFooter={hideFooter}
                syncTabToUrl={syncTabToUrl}
                initialInputCurrency={initialInputCurrency}
                initialOutputCurrency={initialOutputCurrency}
                swapRedirectCallback={swapRedirectCallback}
                prefilledState={prefilledState}
              />
              <SwapBottomCard />
            </Flex>
          </SwapFormContextProvider>
        </PrefetchBalancesWrapper>
      </SwapAndLimitContextProvider>
    )
  }

  return (
    <SwapAndLimitContextProvider
      initialChainId={chainId}
      initialInputCurrency={initialInputCurrency}
      initialOutputCurrency={initialOutputCurrency}
      multichainUXEnabled
    >
      {/* TODO: Move SwapContextProvider inside Swap tab ONLY after SwapHeader removes references to trade / autoSlippage */}
      <SwapAndLimitContext.Consumer>
        {({ currentTab }) => (
          <SwapContextProvider
            initialTypedValue={initialTypedValue}
            initialIndependentField={initialIndependentField}
            multichainUXEnabled
          >
            <Flex width="100%" gap="$spacing16">
              <SwapWrapper isDark={isDark} className={className} id="swap-page">
                {!hideHeader && <SwapHeader compact={compact || !screenSize.sm} syncTabToUrl={syncTabToUrl} />}
                {currentTab === SwapTab.Swap && (
                  <SwapForm
                    onCurrencyChange={onCurrencyChange}
                    initialCurrencyLoading={initialCurrencyLoading}
                    disableTokenInputs={disableTokenInputs}
                  />
                )}
                {/*{currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}*/}
                {currentTab === SwapTab.Send && (
                  <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
                )}
                {currentTab === SwapTab.Buy && <BuyForm disabled={disableTokenInputs} />}
              </SwapWrapper>
              <SwapBottomCard />
            </Flex>
          </SwapContextProvider>
        )}
      </SwapAndLimitContext.Consumer>
    </SwapAndLimitContextProvider>
  )
}

const SWAP_TABS = [SwapTab.Swap, /*SwapTab.Limit,*/ SwapTab.Send, SwapTab.Buy]

const TAB_TYPE_TO_LABEL = {
  [SwapTab.Swap]: (t: AppTFunction) => t('swap.form.header'),
  [SwapTab.Limit]: (t: AppTFunction) => t('swap.limit'),
  [SwapTab.Send]: (t: AppTFunction) => t('send.title'),
  [SwapTab.Buy]: (t: AppTFunction) => t('common.buy.label'),
}

function UniversalSwapFlow({
  hideHeader = false,
  hideFooter = false,
  disableTokenInputs = false,
  syncTabToUrl = true,
  initialInputCurrency,
  initialOutputCurrency,
  prefilledState,
  onCurrencyChange,
  swapRedirectCallback,
}: {
  hideHeader?: boolean
  hideFooter?: boolean
  syncTabToUrl?: boolean
  disableTokenInputs?: boolean
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  prefilledState?: SwapFormState
  onCurrencyChange?: (selected: CurrencyState) => void
  swapRedirectCallback?: SwapRedirectFn
}) {
  const [currentTab, setCurrentTab] = useState(SwapTab.Swap)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  useEffect(() => {
    const tab = PathnameToTab[pathname]

    if (tab) {
      setCurrentTab(tab)
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

  const SWAP_TAB_OPTIONS = useMemo(() => {
    return SWAP_TABS.map((tab) => ({
      value: tab,
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
  }, [t, currentTab])

  // token warnings for URL-prefilled tokens via /swap?inputCurrency=...
  const prefilledInputCurrencyInfo = useCurrencyInfo(initialInputCurrency ? currencyId(initialInputCurrency) : '')
  const prefilledOutputCurrencyInfo = useCurrencyInfo(initialOutputCurrency ? currencyId(initialOutputCurrency) : '')
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const closeTokenWarning = useCallback(() => setDismissTokenWarning(true), [setDismissTokenWarning])
  const urlTokensNotInDefault = useMemo(
    () =>
      prefilledInputCurrencyInfo || prefilledOutputCurrencyInfo
        ? // dismiss warning if all imported tokens are in active lists
          [prefilledInputCurrencyInfo, prefilledOutputCurrencyInfo]
            .filter(
              (token): token is CurrencyInfo =>
                (token?.currency.isToken && token.safetyLevel !== SafetyLevel.Verified && token.currency.symbol !== "GRG") ?? false,
            )
            .map((token: CurrencyInfo) => token.currency as Token)
        : [],
    [prefilledInputCurrencyInfo, prefilledOutputCurrencyInfo],
  )

  const { updateSwapForm } = useSwapFormContext()

  return (
    <>
      <TokenSafetyModal
        isOpen={urlTokensNotInDefault.length > 0 && !dismissTokenWarning}
        token0={urlTokensNotInDefault[0]}
        token1={urlTokensNotInDefault[1]}
        onAcknowledge={closeTokenWarning}
        onReject={() => {
          closeTokenWarning()
          updateSwapForm({
            [CurrencyField.INPUT]: undefined,
            [CurrencyField.OUTPUT]: undefined,
            selectingCurrencyField: undefined,
          })
          onCurrencyChange?.({
            inputCurrency: undefined,
            outputCurrency: undefined,
          })
        }}
        closeModalOnly={closeTokenWarning}
        onToken0BlockAcknowledged={() => {
          updateSwapForm({
            [CurrencyField.INPUT]: undefined,
            selectingCurrencyField: undefined,
          })
          onCurrencyChange?.({ inputCurrency: undefined })
        }}
        onToken1BlockAcknowledged={() => {
          updateSwapForm({
            [CurrencyField.OUTPUT]: undefined,
            selectingCurrencyField: undefined,
          })
          onCurrencyChange?.({ outputCurrency: undefined })
        }}
        showCancel={true}
      />
      <Flex>
        {!hideHeader && (
          <Flex row gap="$spacing16">
            <SegmentedControl
              outlined={false}
              size="large"
              options={SWAP_TAB_OPTIONS}
              selectedOption={currentTab}
              onSelectOption={onTabClick}
            />
          </Flex>
        )}
        {currentTab === SwapTab.Swap && (
          <SwapFlow
            customSettings={WEB_CUSTOM_SWAP_SETTINGS}
            hideHeader={hideHeader}
            hideFooter={hideFooter}
            onClose={noop}
            swapRedirectCallback={swapRedirectCallback}
            swapCallback={swapCallback}
            wrapCallback={wrapCallback}
            prefilledState={prefilledState}
          />
        )}
        {/*{currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}*/}
        {currentTab === SwapTab.Send && (
          <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
        )}
        {currentTab === SwapTab.Buy && <BuyForm disabled={disableTokenInputs} />}
      </Flex>
    </>
  )
}

const DisabledOverlay = styled(Flex, {
  position: 'absolute',
  width: '100%',
  height: '100%',
  zIndex: zIndices.overlay,
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
