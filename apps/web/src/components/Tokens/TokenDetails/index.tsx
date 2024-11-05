import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { MobileBottomBar, TDPActionTabs } from 'components/NavBar/MobileBottomBar'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import { ActivitySection } from 'components/Tokens/TokenDetails/ActivitySection'
import BalanceSummary, { PageChainBalanceSummary } from 'components/Tokens/TokenDetails/BalanceSummary'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import { LeftPanel, RightPanel, TokenDetailsLayout, TokenInfoContainer } from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import { TokenDescription } from 'components/Tokens/TokenDetails/TokenDescription'
import { TokenDetailsHeader } from 'components/Tokens/TokenDetails/TokenDetailsHeader'
import { Hr } from 'components/Tokens/TokenDetails/shared'
import { CHAIN_ID_TO_BACKEND_NAME, isSupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import deprecatedStyled from 'lib/styled-components'
import { Swap } from 'pages/Swap'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { CurrencyState } from 'state/swap/types'
import { Flex, useIsTouchDevice } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { Trans } from 'uniswap/src/i18n'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
import { getInitialLogoUrl } from 'utils/getInitialLogoURL'

const DividerLine = deprecatedStyled(Hr)`
  margin-top: 40px;
  margin-bottom: 40px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
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

function useSwapInitialInputCurrency() {
  const { currency } = useTDPContext()
  const parsedQs = useParsedQueryString()

  const inputTokenAddress = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? (parsedQs.inputCurrency as string) : undefined
  }, [parsedQs])

  return useCurrency(inputTokenAddress, currency.chainId)
}

function TDPSwapComponent() {
  const { address, currency, currencyChainId, warning } = useTDPContext()
  const navigate = useNavigate()

  const handleCurrencyChange = useCallback(
    (tokens: CurrencyState) => {
      const inputCurrencyURLAddress = getCurrencyURLAddress(tokens.inputCurrency)
      const outputCurrencyURLAddress = getCurrencyURLAddress(tokens.outputCurrency)
      if (
        addressesAreEquivalent(inputCurrencyURLAddress, address) ||
        addressesAreEquivalent(outputCurrencyURLAddress, address)
      ) {
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
        chain:
          CHAIN_ID_TO_BACKEND_NAME[
            isSupportedChainId(newDefaultToken.chainId) ? newDefaultToken.chainId : currencyChainId
          ],
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

  return (
    <>
      <Swap
        syncTabToUrl={false}
        chainId={currency.chainId}
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={currency}
        onCurrencyChange={handleCurrencyChange}
        compact
      />
      {warning && <TokenSafetyMessage tokenAddress={address} warning={warning} />}
    </>
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
  const { lg: showRightPanel } = useScreenSize()
  const { direction: scrollDirection } = useScroll()
  const isTouchDevice = useIsTouchDevice()

  return (
    <TDPAnalytics>
      <TokenDetailsLayout>
        <LeftPanel>
          <TDPBreadcrumb />
          <TokenInfoContainer data-testid="token-info-container">
            <TokenDetailsHeader />
          </TokenInfoContainer>
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
          <div data-testid="tdp-mobile-bottom-bar">
            <TDPActionTabs />
          </div>
        </MobileBottomBar>
      </TokenDetailsLayout>
    </TDPAnalytics>
  )
}
