import { getTokenDetailsURL } from 'appGraphql/data/util'
import { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { MobileBottomBar, TDPActionTabs } from 'components/NavBar/MobileBottomBar'
import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { ActivitySection } from 'components/Tokens/TokenDetails/ActivitySection'
import BalanceSummary, { PageChainBalanceSummary } from 'components/Tokens/TokenDetails/BalanceSummary'
import { BridgedAssetSection } from 'components/Tokens/TokenDetails/BridgedAssetSection'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import { LeftPanel, RightPanel, TokenDetailsLayout } from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import { Hr } from 'components/Tokens/TokenDetails/shared'
import { TokenDescription } from 'components/Tokens/TokenDetails/TokenDescription'
import { TokenDetailsHeader } from 'components/Tokens/TokenDetails/TokenDetailsHeader'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import { deprecatedStyled } from 'lib/styled-components'
import { Swap } from 'pages/Swap'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { CurrencyState } from 'state/swap/types'
import { Flex, GeneratedIcon, Text, useIsTouchDevice, useMedia } from 'ui/src'
import { InlineWarningCard } from 'uniswap/src/components/InlineWarningCard/InlineWarningCard'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { isUniverseChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import {
  AZTEC_ADDRESS,
  AZTEC_URL,
} from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getAztecUnavailableWarning'
import { useShouldShowAztecWarning } from 'uniswap/src/hooks/useShouldShowAztecWarning'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { areCurrenciesEqual, currencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { getInitialLogoUrl } from 'utils/getInitialLogoURL'

const DividerLine = deprecatedStyled(Hr)`
  margin-top: 40px;
  margin-bottom: 40px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    opacity: 0;
    margin-bottom: 0;
  }
`

function TDPBreadcrumb() {
  const { address, currency, currencyChain } = useTDPContext()

  return (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={`/explore/${currencyChain.toLowerCase()}`}>
        <Trans i18nKey="common.explore" /> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to={`/explore/tokens/${currencyChain.toLowerCase()}`}>
        <Trans i18nKey="common.tokens" /> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb address={address} currency={currency} />
    </BreadcrumbNavContainer>
  )
}

function getCurrencyURLAddress(currency?: Currency): string {
  if (!currency) {
    return ''
  }

  if (currency.isToken) {
    return currency.address
  }
  return NATIVE_CHAIN_ID
}

// Defaults the input currency to the output currency's native currency or undefined if the output currency is already the chain's native currency
// Note: Query string input currency takes precedence if it's set
function useSwapInitialCurrencies() {
  const { currency } = useTDPContext()
  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()

  const inputTokenAddress = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string'
      ? parsedQs.inputCurrency
      : currency.isNative
        ? undefined
        : getNativeAddress(currency.chainId)
  }, [currency.chainId, currency.isNative, parsedQs.inputCurrency])

  const outputTokenAddress = useMemo(() => {
    return typeof parsedQs.outputCurrency === 'string'
      ? parsedQs.outputCurrency
      : currency.isNative
        ? undefined
        : getNativeAddress(currency.chainId)
  }, [currency.chainId, currency.isNative, parsedQs.outputCurrency])

  return {
    inputCurrency: useCurrency({
      address: inputTokenAddress,
      chainId: currency.chainId,
    }),
    outputCurrency: useCurrency({
      address: outputTokenAddress,
      chainId: currency.chainId,
    }),
  }
}

function includesToken(tokens: CurrencyState | undefined, token: Currency | undefined): boolean {
  if (!tokens || !token) {
    return false
  }
  return areCurrenciesEqual(tokens.inputCurrency, token) || areCurrenciesEqual(tokens.outputCurrency, token)
}

function TDPSwapComponent() {
  const { t } = useTranslation()
  const { address, currency, currencyChainId, tokenColor } = useTDPContext()
  const navigate = useNavigate()

  const currencyInfo = useCurrencyInfo(currencyId(currency))

  const { inputCurrency, outputCurrency } = useSwapInitialCurrencies()

  // Other token to prefill the swap form with
  const initialInputCurrency = inputCurrency
  // If the initial input currency is the same as the TDP currency, then we are selling the TDP currency
  const initialOutputCurrency = useMemo((): Currency | undefined => {
    if (
      areCurrenciesEqual(initialInputCurrency, currency) &&
      // ensure the output is not equal to the input before setting
      !areCurrenciesEqual(outputCurrency, initialInputCurrency)
    ) {
      return outputCurrency
    }

    // ensure the context currency is not equal to the input before setting
    if (areCurrenciesEqual(currency, initialInputCurrency)) {
      return undefined
    }

    return currency
  }, [currency, initialInputCurrency, outputCurrency])

  const [prevTokens, setPrevTokens] = useState<CurrencyState>({
    inputCurrency: initialInputCurrency,
    outputCurrency: initialOutputCurrency,
  })

  const handleCurrencyChange = useCallback(
    (tokens: CurrencyState, isBridgePair?: boolean) => {
      const inputCurrencyURLAddress = getCurrencyURLAddress(tokens.inputCurrency)
      const outputCurrencyURLAddress = getCurrencyURLAddress(tokens.outputCurrency)

      const inputEquivalent =
        tokens.inputCurrency &&
        areAddressesEqual({
          addressInput1: { address: inputCurrencyURLAddress, chainId: tokens.inputCurrency.chainId },
          addressInput2: { address, chainId: currencyChainId },
        }) &&
        tokens.inputCurrency.chainId === currencyChainId
      const outputEquivalent =
        tokens.outputCurrency &&
        areAddressesEqual({
          addressInput1: { address: outputCurrencyURLAddress, chainId: tokens.outputCurrency.chainId },
          addressInput2: { address, chainId: currencyChainId },
        }) &&
        tokens.outputCurrency.chainId === currencyChainId

      if (inputEquivalent || outputEquivalent || isBridgePair) {
        setPrevTokens(tokens)
        return
      }

      // If the user replaced the default token, we will hit this path.
      // In this case, we want to navigate to the token that replaced it,
      // which is the token that was not in the previous state.
      const newDefaultToken = includesToken(prevTokens, tokens.inputCurrency)
        ? tokens.outputCurrency
        : tokens.inputCurrency

      setPrevTokens(tokens)

      if (!newDefaultToken) {
        return
      }

      const preloadedLogoSrc = getInitialLogoUrl({
        address: newDefaultToken.wrapped.address,
        chainId: newDefaultToken.chainId,
      })
      const url = getTokenDetailsURL({
        // The function falls back to "NATIVE" if the address is null
        address: newDefaultToken.isNative ? null : newDefaultToken.address,
        chain: toGraphQLChain(isUniverseChainId(newDefaultToken.chainId) ? newDefaultToken.chainId : currencyChainId),
        inputAddress: inputCurrencyURLAddress,
        outputAddress: outputCurrencyURLAddress,
      })
      navigate(url, { state: { preloadedLogoSrc } })
    },
    [address, currencyChainId, navigate, prevTokens],
  )

  const [showWarningModal, setShowWarningModal] = useState(false)
  const closeWarningModal = useCallback(() => setShowWarningModal(false), [])

  const onTokenWarningReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-token-warning-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  return (
    <Flex gap="$gap12">
      <Swap
        syncTabToUrl={false}
        initialInputChainId={currency.chainId}
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={initialOutputCurrency}
        onCurrencyChange={handleCurrencyChange}
        tokenColor={tokenColor}
      />
      <TokenWarningCard currencyInfo={currencyInfo} onPress={() => setShowWarningModal(true)} />
      {currencyInfo && (
        // Intentionally duplicative with the TokenWarningModal in the swap component; this one only displays when user clicks "i" Info button on the TokenWarningCard
        <TokenWarningModal
          currencyInfo0={currencyInfo}
          isInfoOnlyWarning
          isVisible={showWarningModal}
          closeModalOnly={closeWarningModal}
          onReportSuccess={onTokenWarningReportSuccess}
          onAcknowledge={closeWarningModal}
        />
      )}
    </Flex>
  )
}

function TDPAnalytics({ children }: PropsWithChildren) {
  const { address, currency } = useTDPContext()
  return (
    <Trace
      logImpression
      page={InterfacePageName.TokenDetailsPage}
      properties={{
        tokenAddress: address,
        tokenSymbol: currency.symbol,
        tokenName: currency.name,
        chainId: currency.chainId,
      }}
    >
      {children}
    </Trace>
  )
}

function AztecWarningBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const { address } = useTDPContext()
  const showAztecWarning = useShouldShowAztecWarning(address)

  if (!showAztecWarning) {
    return null
  }

  return (
    <Flex mt="$spacing24">
      <InlineWarningCard
        severity={WarningSeverity.Low}
        Icon={WarningIcon as GeneratedIcon}
        heading={t('web.explore.tokenDetails.data.warning')}
      />
    </Flex>
  )
}

export default function TokenDetails() {
  const { tokenQuery, currencyChain, multiChainMap, address } = useTDPContext()
  const tokenQueryData = tokenQuery.data?.token
  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const media = useMedia()
  const showRightPanel = !media.xl
  const { direction: scrollDirection } = useScroll()
  const isTouchDevice = useIsTouchDevice()
  const { t } = useTranslation()
  const isAztecDisabled = useFeatureFlag(FeatureFlags.DisableAztecToken)
  const isAztec = address.toLowerCase() === AZTEC_ADDRESS
  const showAztecWarning = isAztec && isAztecDisabled

  const {
    value: isAztecWarningModalOpen,
    setTrue: openAztecWarningModal,
    setFalse: closeAztecWarningModal,
  } = useBooleanState(false)

  return (
    <TDPAnalytics>
      <TokenDetailsLayout>
        <LeftPanel>
          <TDPBreadcrumb />
          <TokenDetailsHeader />
          <ChartSection />
          <AztecWarningBanner />
          {!showRightPanel && !!pageChainBalance && (
            <Flex mt="$spacing40" gap="$gap24">
              <PageChainBalanceSummary pageChainBalance={pageChainBalance} alignLeft />
              <BridgedAssetSection />
            </Flex>
          )}
          <StatsSection tokenQueryData={tokenQueryData} />
          <DividerLine />
          <ActivitySection />
        </LeftPanel>
        <RightPanel>
          {/* Uses display to preserve component state */}
          <Flex display={showRightPanel ? 'flex' : 'none'} gap="$gap24">
            <TDPSwapComponent />
            <BalanceSummary />
            <BridgedAssetSection />
          </Flex>
          <TokenDescription />
        </RightPanel>
        <MobileBottomBar hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>
          {/* TODO(WEB-4800): data-testid is not passed to ui/src elements when animation is set */}
          {/* Remove this extra div when WEB-4800 is fixed */}
          <Flex data-testid="tdp-mobile-bottom-bar">
            <TDPActionTabs onAztecActionPress={openAztecWarningModal} />
          </Flex>
        </MobileBottomBar>
      </TokenDetailsLayout>
      {showAztecWarning && isAztecWarningModalOpen && (
        <WarningModal
          isOpen={isAztecWarningModalOpen}
          modalName={ModalName.SwapWarning}
          severity={WarningSeverity.Blocked}
          title={t('swap.warning.aztecUnavailable.title')}
          captionComponent={
            <Flex centered gap="$spacing12">
              <Text color="$neutral2" textAlign="center" variant="body3">
                {t('swap.warning.aztecUnavailable.message')}
              </Text>
              <LearnMoreLink display="inline" textColor="$neutral1" textVariant="buttonLabel3" url={AZTEC_URL} />
            </Flex>
          }
          acknowledgeText={t('common.button.close')}
          onClose={closeAztecWarningModal}
          onAcknowledge={closeAztecWarningModal}
        />
      )}
    </TDPAnalytics>
  )
}
