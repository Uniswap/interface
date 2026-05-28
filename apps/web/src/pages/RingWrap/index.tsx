import { FEW_WRAPPED_TOKEN_FACTORY_ADDRESS } from '@ring-protocol/few-v2-sdk'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { SwapBottomCard } from 'components/SwapBottomCard'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { PageWrapper } from 'components/swap/styled'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { FEW_SUPPORTED_CHAIN_IDS } from 'pages/LegacyPool/redirects'
import { FewTokenOutputAutoUpdater } from 'pages/RingWrap/RingWrapAutoFill'
import { useResetOverrideOneClickSwapFlag } from 'pages/Swap/settings/OneClickSwap'
import { useWebSwapSettings } from 'pages/Swap/settings/useWebSwapSettings'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useSwapCallback } from 'state/sagas/transactions/swapSaga'
import { useWrapCallback } from 'state/sagas/transactions/wrapSaga'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { Flex, Text, Tooltip, styled } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { useEnabledChains, useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import Trace from 'uniswap/src/features/telemetry/Trace'
import {
  PasskeyAuthStatus,
  SwapRedirectFn,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { TransactionSettingsContextProvider } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { TransactionSettingKey } from 'uniswap/src/features/transactions/components/settings/slice'
import { RingWrapFlow } from 'uniswap/src/features/transactions/ringwrap/RingWrapFlow/RingWrapFlow'
import { SwapDependenciesContextProvider } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContextProvider'
import { SwapFormContextProvider, SwapFormState } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { selectFilteredChainIds } from 'uniswap/src/features/transactions/swap/contexts/selectors'
import { useSwapPrefilledState } from 'uniswap/src/features/transactions/swap/form/hooks/useSwapPrefilledState'
import { currencyToAsset } from 'uniswap/src/features/transactions/swap/utils/asset'
import { CurrencyField } from 'uniswap/src/types/currency'
import { isMobileWeb } from 'utilities/src/platform'
import noop from 'utilities/src/react/noop'

function getSupportedWrapChainId(chainId?: UniverseChainId, fallbackChainId?: UniverseChainId): UniverseChainId {
  if (chainId && FEW_SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return chainId
  }

  if (fallbackChainId && FEW_SUPPORTED_CHAIN_IDS.includes(fallbackChainId)) {
    return fallbackChainId
  }

  return FEW_SUPPORTED_CHAIN_IDS[0]
}

function isSupportedWrapCurrency(currency?: Currency): boolean {
  return !!currency && FEW_SUPPORTED_CHAIN_IDS.includes(currency.chainId as UniverseChainId)
}

export default function RingWrapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { defaultChainId } = useEnabledChains()
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

  const wrapInitialChainId = getSupportedWrapChainId(initialChainId, defaultChainId)
  const fallbackInputCurrency = useCurrency(getNativeAddress(wrapInitialChainId), wrapInitialChainId)
  const wrapInitialInputCurrency = isSupportedWrapCurrency(initialInputCurrency)
    ? initialInputCurrency
    : fallbackInputCurrency
  const wrapInitialOutputCurrency =
    initialOutputCurrency?.chainId === wrapInitialChainId && isSupportedWrapCurrency(initialOutputCurrency)
      ? initialOutputCurrency
      : undefined

  useEffect(() => {
    if (triggerConnect) {
      accountDrawer.open()
      navigate(location.pathname, { replace: true })
    }
  }, [accountDrawer, triggerConnect, navigate, location.pathname])

  return (
    <Trace logImpression page={InterfacePageName.SWAP_PAGE}>
      <PageWrapper>
        <RingWrap
          chainId={wrapInitialChainId}
          initialInputCurrency={wrapInitialInputCurrency}
          initialOutputCurrency={wrapInitialOutputCurrency}
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
function RingWrap({
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
  const wrapFilteredChainIds = useMemo(
    () =>
      usePersistedFilteredChainIds
        ? {
            [CurrencyField.INPUT]: getSupportedWrapChainId(persistedFilteredChainIds?.[CurrencyField.INPUT], chainId),
            [CurrencyField.OUTPUT]: getSupportedWrapChainId(persistedFilteredChainIds?.[CurrencyField.OUTPUT], chainId),
          }
        : undefined,
    [chainId, persistedFilteredChainIds, usePersistedFilteredChainIds],
  )

  const basePrefilledState = useSwapPrefilledState({
    input,
    output,
    exactAmountToken: initialTypedValue ?? '',
    exactCurrencyField: initialIndependentField ?? CurrencyField.INPUT,
    selectingCurrencyField: isSwapTokenSelectorOpen ? CurrencyField.OUTPUT : undefined,
    selectingCurrencyChainId: swapOutputChainId,
    skipFocusOnCurrencyField: isMobileWeb,
    filteredChainIdsOverride: wrapFilteredChainIds,
  })

  const prefilledState = useMemo(
    () => (basePrefilledState ? { ...basePrefilledState, tokenSelectorChainIds: FEW_SUPPORTED_CHAIN_IDS } : undefined),
    [basePrefilledState],
  )

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
                <UniversalRingWrapFlow
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

function UniversalRingWrapFlow({
  hideHeader = false,
  hideFooter = false,
  // syncTabToUrl = true,
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
  // const { pathname } = useLocation()
  // const navigate = useNavigate()
  const { t } = useTranslation()
  const swapCallback = useSwapCallback()
  const wrapCallback = useWrapCallback()

  const swapSettings = useWebSwapSettings()
  const resetDisableOneClickSwap = useResetOverrideOneClickSwapFlag()

  const account = useAccount()
  const connectorId = account.connector?.id
  const passkeyAuthStatus = useGetPasskeyAuthStatus(connectorId)

  const isFewSupportedOnChain = useMemo(() => {
    const currentChainId = account.chainId
    if (!currentChainId) {
      return true
    }
    try {
      FEW_WRAPPED_TOKEN_FACTORY_ADDRESS(currentChainId)
      return true
    } catch {
      return false
    }
  }, [account.chainId])

  // Use SegmentedControl logic to render the header, similar to Swap page
  const WRAP_TAB_OPTIONS = [
    {
      value: 'wrap',
      display: (
        <Text variant="buttonLabel3" hoverStyle={{ color: '$neutral1' }} color="$neutral1" tag="h1">
          {t('swap.button.wrap')}
        </Text>
      ),
    },
  ]

  return (
    <Flex>
      {!hideHeader && (
        <Flex row gap="$spacing16" px="$spacing12" height={42} alignItems="center">
          {WRAP_TAB_OPTIONS[0].display}
        </Flex>
      )}

      {!isFewSupportedOnChain ? (
        <FewUnsupportedChainMessage />
      ) : (
        <>
          {/* Auto fill FEW token to output */}
          <FewTokenOutputAutoUpdater enabled={true} />

          <Flex gap="$spacing16">
            <SwapDependenciesContextProvider swapCallback={swapCallback} wrapCallback={wrapCallback}>
              <RingWrapFlow
                settings={swapSettings}
                hideHeader={hideHeader}
                hideFooter={hideFooter}
                onClose={noop}
                swapRedirectCallback={swapRedirectCallback}
                onCurrencyChange={onCurrencyChange}
                prefilledState={prefilledState}
                tokenColor={tokenColor}
                onSubmitWrap={resetDisableOneClickSwap}
                passkeyAuthStatus={passkeyAuthStatus}
              />
            </SwapDependenciesContextProvider>
            <SwapBottomCard />
          </Flex>
        </>
      )}
    </Flex>
  )
}

const FewUnsupportedChainMessage = () => {
  const { t } = useTranslation()

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      py="$spacing36"
      px="$spacing16"
      borderRadius="$rounded16"
      backgroundColor="$surface2"
    >
      <Text variant="body2" color="$neutral2" textAlign="center">
        {t('ring.wrap.unsupportedChain', { defaultValue: 'FEW Wrap is not available on this chain' })}
      </Text>
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
