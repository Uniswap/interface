import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import { MobileBottomBar, TDPActionTabs } from 'components/NavBar/MobileBottomBar'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { ActivitySection } from 'components/Tokens/TokenDetails/ActivitySection'
import BalanceSummary, { PageChainBalanceSummary } from 'components/Tokens/TokenDetails/BalanceSummary'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import MobileBalanceSummaryFooter from 'components/Tokens/TokenDetails/MobileBalanceSummaryFooter'
import { LeftPanel, RightPanel, TokenDetailsLayout, TokenInfoContainer } from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import { TokenDescription } from 'components/Tokens/TokenDetails/TokenDescription'
import { TokenDetailsHeader } from 'components/Tokens/TokenDetails/TokenDetailsHeader'
import { Hr } from 'components/Tokens/TokenDetails/shared'
import { CHAIN_ID_TO_BACKEND_NAME, isSupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { useScreenSize } from 'hooks/screenSize'
import { useAccount } from 'hooks/useAccount'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { Swap } from 'pages/Swap'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { CurrencyState } from 'state/swap/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
import { getInitialLogoUrl } from 'utils/getInitialLogoURL'

const DividerLine = styled(Hr)`
  margin-top: 40px;
  margin-bottom: 40px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    opacity: 0;
    margin-bottom: 0;
  }
`
const BalanceSummaryContainer = styled.div`
  margin-top: 40px;
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
  const account = useAccount()
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

  const [openTokenSafetyModal, setOpenTokenSafetyModal] = useState(false)
  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap, setContinueSwap],
  )
  const isBlockedToken = warning?.canProceed === false

  return (
    <>
      <div
        style={{ pointerEvents: isBlockedToken ? 'none' : 'auto' }}
        onClick={() => isBlockedToken && setOpenTokenSafetyModal(true)}
      >
        <Swap
          syncTabToUrl={false}
          chainId={currency.chainId}
          initialInputCurrency={initialInputCurrency}
          initialOutputCurrency={currency}
          onCurrencyChange={handleCurrencyChange}
          disableTokenInputs={currency.chainId !== account.chainId}
          compact
        />
      </div>
      {warning && <TokenSafetyMessage tokenAddress={address} warning={warning} />}
      <TokenSafetyModal
        isOpen={openTokenSafetyModal || !!continueSwap}
        token0={currency.isToken ? currency : undefined}
        onContinue={() => onResolveSwap(true)}
        onBlocked={() => {
          setOpenTokenSafetyModal(false)
        }}
        onCancel={() => onResolveSwap(false)}
        showCancel={true}
      />
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
  const isLegacyNav = !useFeatureFlag(FeatureFlags.NavRefresh)
  const { lg: showRightPanel } = useScreenSize()
  const { direction: scrollDirection } = useScroll()

  return (
    <TDPAnalytics>
      <TokenDetailsLayout>
        <LeftPanel>
          <TDPBreadcrumb />
          <TokenInfoContainer data-testid="token-info-container">
            <TokenDetailsHeader />
          </TokenInfoContainer>
          <ChartSection />
          {!isLegacyNav && !showRightPanel && !!pageChainBalance && (
            <BalanceSummaryContainer>
              <PageChainBalanceSummary pageChainBalance={pageChainBalance} alignLeft />
            </BalanceSummaryContainer>
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
        {isLegacyNav ? (
          <MobileBalanceSummaryFooter />
        ) : (
          <MobileBottomBar $hide={scrollDirection === ScrollDirection.DOWN}>
            <TDPActionTabs />
          </MobileBottomBar>
        )}
      </TokenDetailsLayout>
    </TDPAnalytics>
  )
}
