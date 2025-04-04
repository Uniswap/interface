import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { MobileBottomBar, TDPActionTabs } from 'components/NavBar/MobileBottomBar'
import { ActivitySection } from 'components/Tokens/TokenDetails/ActivitySection'
import BalanceSummary, { PageChainBalanceSummary } from 'components/Tokens/TokenDetails/BalanceSummary'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import { LeftPanel, RightPanel, TokenDetailsLayout } from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import { TokenDescription } from 'components/Tokens/TokenDetails/TokenDescription'
import { TokenDetailsHeader } from 'components/Tokens/TokenDetails/TokenDetailsHeader'
import { Hr } from 'components/Tokens/TokenDetails/shared'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import deprecatedStyled from 'lib/styled-components'
import { Swap } from 'pages/Swap'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { Trans } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CurrencyState } from 'state/swap/types'
import { Flex, useIsTouchDevice, useMedia } from 'ui/src'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { isUniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
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
function useSwapInitialInputCurrency() {
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

  return useCurrency(inputTokenAddress, currency.chainId)
}

function TDPSwapComponent() {
  const { address, currency, currencyChainId, tokenColor } = useTDPContext()
  const navigate = useNavigate()

  const currencyInfo = useCurrencyInfo(currencyId(currency))

  const handleCurrencyChange = useCallback(
    (tokens: CurrencyState, isBridgePair?: boolean) => {
      const inputCurrencyURLAddress = getCurrencyURLAddress(tokens.inputCurrency)
      const outputCurrencyURLAddress = getCurrencyURLAddress(tokens.outputCurrency)

      const inputEquivalent =
        addressesAreEquivalent(inputCurrencyURLAddress, address) && tokens.inputCurrency?.chainId === currencyChainId
      const outputEquivalent =
        addressesAreEquivalent(outputCurrencyURLAddress, address) && tokens.outputCurrency?.chainId === currencyChainId

      if (inputEquivalent || outputEquivalent || isBridgePair) {
        return
      }

      const newDefaultToken = tokens.outputCurrency ?? tokens.inputCurrency

      if (!newDefaultToken) {
        return
      }

      const preloadedLogoSrc = getInitialLogoUrl(
        newDefaultToken.wrapped.address,
        newDefaultToken.chainId,
        newDefaultToken.isNative,
      )
      const url = getTokenDetailsURL({
        // The function falls back to "NATIVE" if the address is null
        address: newDefaultToken.isNative ? null : newDefaultToken.address,
        chain: toGraphQLChain(isUniverseChainId(newDefaultToken.chainId) ? newDefaultToken.chainId : currencyChainId),
        inputAddress:
          // If only one token was selected before we navigate, then it was the default token and it's being replaced.
          // On the new page, the *new* default token becomes the output, and we don't have another option to set as the input token.
          tokens.inputCurrency && tokens.inputCurrency !== newDefaultToken ? inputCurrencyURLAddress : null,
      })
      navigate(url, { state: { preloadedLogoSrc } })
    },
    [address, currencyChainId, navigate],
  )

  // Other token to prefill the swap form with
  const initialInputCurrency = useSwapInitialInputCurrency()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const closeWarningModal = useCallback(() => setShowWarningModal(false), [])

  return (
    <Flex gap="$gap12">
      <Swap
        syncTabToUrl={false}
        chainId={currency.chainId}
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={currency}
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
      page={InterfacePageName.TOKEN_DETAILS_PAGE}
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

export default function TokenDetails() {
  const { address, currency, tokenQuery, currencyChain, multiChainMap } = useTDPContext()
  const tokenQueryData = tokenQuery.data?.token
  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const media = useMedia()
  const showRightPanel = !media.xl
  const { direction: scrollDirection } = useScroll()
  const isTouchDevice = useIsTouchDevice()

  return (
    <TDPAnalytics>
      <TokenDetailsLayout>
        <LeftPanel>
          <TDPBreadcrumb />
          <TokenDetailsHeader />
          <ChartSection />
          {!showRightPanel && !!pageChainBalance && (
            <Flex mt="$spacing40">
              <PageChainBalanceSummary pageChainBalance={pageChainBalance} alignLeft />
            </Flex>
          )}
          <StatsSection chainId={currency.chainId} address={address} tokenQueryData={tokenQueryData} />
          <DividerLine />
          <ActivitySection />
        </LeftPanel>
        <RightPanel>
          {showRightPanel && (
            <>
              <TDPSwapComponent />
              <BalanceSummary />
            </>
          )}
          <TokenDescription />
        </RightPanel>
        <MobileBottomBar hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>
          {/* TODO(WEB-4800): data-testid is not passed to ui/src elements when animation is set */}
          {/* Remove this extra div when WEB-4800 is fixed */}
          <Flex data-testid="tdp-mobile-bottom-bar">
            <TDPActionTabs />
          </Flex>
        </MobileBottomBar>
      </TokenDetailsLayout>
    </TDPAnalytics>
  )
}
