import { Currency, Token } from '@uniswap/sdk-core'
import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { SwapBottomCard } from 'components/SwapBottomCard'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import ChartSection, { useCreateTDPChartState } from 'components/Tokens/TokenDetails/ChartSection'
import { PageWrapper } from 'components/swap/styled'
import { useAccount } from 'hooks/useAccount'
import { useDeferredComponent } from 'hooks/useDeferredComponent'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { useModalState } from 'hooks/useModalState'
import { useSelectedTokenState } from 'hooks/useSelectedTokenAddress'
import { useResetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useWebSwapSettings } from 'pages/Swap/settings/useWebSwapSettings'
import { TDPProvider } from 'pages/TokenDetails/TDPContext'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { Flex, SegmentedControlOption, Text, Tooltip, styled } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { zIndexes } from 'ui/src/theme'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useTokenWebQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfaceEventName, InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  PasskeyAuthStatus,
  SwapRedirectFn,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/components/settings/slice'
import { SwapFlow } from 'uniswap/src/features/transactions/swap/SwapFlow/SwapFlow'
import { SwapDependenciesContextProvider } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContextProvider'
import { SwapFormContextProvider, SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/contexts/selectors'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { isMobileWeb } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'
import { isIFramed } from 'utils/isIFramed'
import './newSwapStyle.css'

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
    <Trace logImpression page={InterfacePageName.SwapPage}>
      <PageWrapper>
        <Swap
          chainId={initialChainId}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={initialOutputCurrency}
          initialTypedValue={initialTypedValue}
          initialIndependentField={initialField}
          syncTabToUrl={true}
          usePersistedFilteredChainIds
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
  usePersistedFilteredChainIds = false,
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
  usePersistedFilteredChainIds?: boolean
  passkeyAuthStatus?: PasskeyAuthStatus
}) {
  const isExplorePage = useIsPage(PageType.EXPLORE)
  const isModeMismatch = useIsModeMismatch(chainId)
  const isSharedSwapDisabled = isModeMismatch && isExplorePage

  const input = currencyToAsset(initialInputCurrency)
  const output = currencyToAsset(initialOutputCurrency)

  const { isSwapTokenSelectorOpen, swapOutputChainId } = useUniswapContext()
  const persistedFilteredChainIds = useSelector(selectFilteredChainIds)

  const prefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
    selectingCurrencyChainId: swapOutputChainId,
    skipFocusOnCurrencyField: isMobileWeb,
    filteredChainIdsOverride: usePersistedFilteredChainIds ? persistedFilteredChainIds : undefined,
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
              <div style={{ width: '100%' }}>
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
              </div>
            </SwapFormContextProvider>
          </PrefetchBalancesWrapper>
        </SwapAndLimitContextProvider>
      </TransactionSettingsContextProvider>
    </MultichainContextProvider>
  )
}

const SWAP_TABS = [SwapTab.Swap, SwapTab.Buy]

const TAB_TYPE_TO_LABEL = {
  [SwapTab.Swap]: (t: AppTFunction) => t('swap.form.header'),
  [SwapTab.Limit]: (t: AppTFunction) => t('swap.limit'),
  [SwapTab.Send]: (t: AppTFunction) => t('send.title'),
  [SwapTab.Buy]: (t: AppTFunction) => t('common.buy.label'),
  [SwapTab.Sell]: (t: AppTFunction) => t('common.sell.label'),
}

const PATHNAME_TO_TAB: { [key: string]: SwapTab } = {
  '/swap': SwapTab.Swap,
  '/send': SwapTab.Send,
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
  const [currentTab, setCurrentTab] = useState(SwapTab.Swap)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

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
  }, [pathname, setCurrentTab, openSendFormModal])

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

  // Chart Context
  interface TokenInfo {
    symbol: string
    address: string
    decimals: number
    name: string
  }

  const TOKENS: TokenInfo[] = [
    {
      symbol: 'USDC',
      // conventional placeholder for native ETH (use 0x0 if your lib expects that)
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      decimals: 6,
      name: 'USD Coin',
    },
    {
      symbol: 'WBTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      name: 'Wrapped Bitcoin',
    },
  ]

  const [selected, setSelected] = useState<TokenInfo>(TOKENS[0])

  let tokenState = useSelectedTokenState() // WBTC

  let wbtcAddress = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
  const chainInfo = getChainInfo(UniverseChainId.Mainnet)

  const tokenQuery = useTokenWebQuery({
    variables: { address: selected.address, chain: chainInfo.backendChain.chain },
    errorPolicy: 'all',
  })

  const chartState = useCreateTDPChartState(selected.address, chainInfo.backendChain.chain)

  const mockCurrency = new Token(
    1, // chainId
    selected.address, // address
    selected.decimals, // decimals
    selected.symbol, // symbol
    selected.name, // name
  )

  const contextValue = useMemo(() => {
    return {
      currency: mockCurrency, // not needed for chart to work
      currencyChain: chainInfo.backendChain.chain,
      currencyChainId: chainInfo.id,
      address: wbtcAddress,
      currencyWasFetchedOnChain: false,
      tokenQuery,
      chartState,
      multiChainMap: {},
      tokenColor: '#f7931a', // use your own color if needed
    }
  }, [tokenQuery, chartState, selected])

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '200px',
      fontFamily: 'Inter, sans-serif',
      marginBottom: '20px',
    },
    select: {
      appearance: 'none',
      padding: '10px 14px',
      borderRadius: '8px',
      background: '#141414',
      color: '#fff',
      border: 'none',
      outline: 'none',
      /* subtle inner glow */
      boxShadow: 'inset 0 0 0 1px rgba(0,255,233,.3), inset 0 4px 18px rgba(0,255,233,.25)',
      cursor: 'pointer',
    },
    addressLabel: {
      fontSize: '12px',
      color: '#7ee8ff',
      wordBreak: 'break-all',
    },
  }

  return (
    <TDPProvider contextValue={contextValue}>
      <div style={styles.wrapper}>
        {/* dropdown */}
        <select
          style={styles.select}
          value={selected.symbol}
          onChange={(e) => {
            const token = TOKENS.find((t) => t.symbol === e.target.value)!
            setSelected(token)
          }}
        >
          {TOKENS.map((t) => (
            <option key={t.symbol} value={t.symbol}>
              {t.symbol}
            </option>
          ))}
        </select>
      </div>
      <div className="newSwap">
        <div style={{ width: '70%' }} className="swap-main">
          <ChartSection />
        </div>
        <div className="swap-main">
          <Flex>
            {!hideHeader && (
              <Flex row gap="$spacing16">
                {/* <SegmentedControl
                outlined={false}
                size="large"
                options={SWAP_TAB_OPTIONS}
                selectedOption={currentTab}
                onSelectOption={onTabClick}
                gap={isMobileWeb ? '$spacing8' : undefined}
              /> */}

                <div className="tab">
                  <p>Swap</p>
                </div>
              </Flex>
            )}
            {currentTab === SwapTab.Swap && (
              <Flex gap="$spacing16" flexDirection="row">
                {/* Chart placeholder (white box) */}

                {/* Swap Form */}
                <Flex flex={1}>
                  <SwapDependenciesContextProvider swapCallback={swapCallback} wrapCallback={wrapCallback}>
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
                  </SwapDependenciesContextProvider>
                </Flex>
                <SwapBottomCard />
              </Flex>
            )}
            {currentTab === SwapTab.Limit && LimitFormWrapper && (
              <LimitFormWrapper onCurrencyChange={onCurrencyChange} />
            )}
            {currentTab === SwapTab.Buy && BuyForm && (
              <BuyForm
                rampDirection={RampDirection.ONRAMP}
                disabled={disableTokenInputs}
                initialCurrency={prefilledState?.output}
              />
            )}
            {currentTab === SwapTab.Sell && BuyForm && (
              <BuyForm
                rampDirection={RampDirection.OFFRAMP}
                disabled={disableTokenInputs}
                initialCurrency={prefilledState?.output}
              />
            )}
          </Flex>
        </div>
      </div>
    </TDPProvider>
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
