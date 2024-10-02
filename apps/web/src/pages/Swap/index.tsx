import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { NetworkAlert } from 'components/NetworkAlert'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import SwapHeader from 'components/swap/SwapHeader'
import { PageWrapper, SwapWrapper } from 'components/swap/styled'
import { PrefetchBalancesWrapper } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { BuyForm } from 'pages/Swap/Buy/BuyForm'
import { LimitFormWrapper } from 'pages/Swap/Limit/LimitForm'
import { SendForm } from 'pages/Swap/Send/SendForm'
import { SwapForm } from 'pages/Swap/SwapForm'
import { ReactNode, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import { SwapAndLimitContextProvider, SwapContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState, SwapAndLimitContext } from 'state/swap/types'
import { useIsDarkMode } from 'theme/components/ThemeToggle'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { SwapRedirectFn } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/hooks/useSwapPrefilledState'
import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { useTranslation } from 'uniswap/src/i18n'
import { InterfaceChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
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
          multichainUXEnabled
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
  multichainUXEnabled = false,
  disableTokenInputs = false,
  compact = false,
  syncTabToUrl,
  swapRedirectCallback,
}: {
  className?: string
  chainId?: InterfaceChainId
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
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregator)

  const universalSwapFlow = useFeatureFlag(FeatureFlags.UniversalSwap)

  if (universalSwapFlow) {
    return (
      <SwapAndLimitContextProvider
        initialChainId={chainId}
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={initialOutputCurrency}
        multichainUXEnabled={multichainUXEnabled}
      >
        <PrefetchBalancesWrapper>
          <UniversalSwapFlow
            hideHeader={hideHeader}
            hideFooter={hideFooter}
            initialInputCurrency={initialInputCurrency}
            initialOutputCurrency={initialOutputCurrency}
            initialTypedValue={initialTypedValue}
            initialIndependentField={initialIndependentField}
            swapRedirectCallback={swapRedirectCallback}
          />
        </PrefetchBalancesWrapper>
      </SwapAndLimitContextProvider>
    )
  }

  return (
    <SwapAndLimitContextProvider
      initialChainId={chainId}
      initialInputCurrency={initialInputCurrency}
      initialOutputCurrency={initialOutputCurrency}
      multichainUXEnabled={multichainUXEnabled}
    >
      {/* TODO: Move SwapContextProvider inside Swap tab ONLY after SwapHeader removes references to trade / autoSlippage */}
      <SwapAndLimitContext.Consumer>
        {({ currentTab }) => (
          <SwapContextProvider
            initialTypedValue={initialTypedValue}
            initialIndependentField={initialIndependentField}
            multichainUXEnabled={multichainUXEnabled}
          >
            <Flex width="100%">
              <SwapWrapper isDark={isDark} className={className} id="swap-page">
                {!hideHeader && <SwapHeader compact={compact || !screenSize.sm} syncTabToUrl={syncTabToUrl} />}
                {currentTab === SwapTab.Swap && (
                  <SwapForm
                    onCurrencyChange={onCurrencyChange}
                    initialCurrencyLoading={initialCurrencyLoading}
                    disableTokenInputs={disableTokenInputs}
                  />
                )}
                {currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
                {currentTab === SwapTab.Send && (
                  <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
                )}
                {currentTab === SwapTab.Buy && forAggregatorEnabled && <BuyForm disabled={disableTokenInputs} />}
              </SwapWrapper>
              <NetworkAlert />
            </Flex>
          </SwapContextProvider>
        )}
      </SwapAndLimitContext.Consumer>
    </SwapAndLimitContextProvider>
  )
}

const SWAP_TABS = [SwapTab.Swap, SwapTab.Limit, SwapTab.Send, SwapTab.Buy]
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
  initialInputCurrency,
  initialOutputCurrency,
  initialTypedValue,
  initialIndependentField,
  onCurrencyChange,
  swapRedirectCallback,
}: {
  hideHeader?: boolean
  hideFooter?: boolean
  disableTokenInputs?: boolean
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialIndependentField?: CurrencyField
  onCurrencyChange?: (selected: CurrencyState) => void
  swapRedirectCallback?: SwapRedirectFn
}) {
  const [currentTab, setCurrentTab] = useState(SwapTab.Swap)
  const { t } = useTranslation()
  const forAggregatorEnabled = useFeatureFlag(FeatureFlags.ForAggregator)
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
  })

  return (
    <Flex gap={hideHeader ? '$none' : '$gap8'}>
      <Flex row gap="$spacing16">
        {!hideHeader &&
          SWAP_TABS.map((tab) => (
            <TouchableArea
              key={tab}
              backgroundColor={currentTab === tab ? '$surface3' : undefined}
              borderRadius="$rounded20"
              px="$padding16"
              py="$padding8"
              onPress={() => setCurrentTab(tab)}
            >
              <Text variant="buttonLabel3" color={currentTab === tab ? '$neutral1' : '$neutral2'}>
                {TAB_TYPE_TO_LABEL[tab](t)}
              </Text>
            </TouchableArea>
          ))}
      </Flex>
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
      {currentTab === SwapTab.Limit && <LimitFormWrapper onCurrencyChange={onCurrencyChange} />}
      {currentTab === SwapTab.Send && (
        <SendForm disableTokenInputs={disableTokenInputs} onCurrencyChange={onCurrencyChange} />
      )}
      {currentTab === SwapTab.Buy && forAggregatorEnabled && <BuyForm disabled={disableTokenInputs} />}
    </Flex>
  )
}
