import { Trans } from '@lingui/macro'
import { InterfacePageName } from '@uniswap/analytics-events'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { BreadcrumbNavContainer, BreadcrumbNavLink, CurrentPageBreadcrumb } from 'components/BreadcrumbNav'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { AboutSection } from 'components/Tokens/TokenDetails/About'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import { LeftPanel, RightPanel, TokenDetailsLayout, TokenInfoContainer } from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCurrency } from 'hooks/Tokens'
import { getInitialUrl } from 'hooks/useAssetLogoSource'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useScreenSize } from 'hooks/useScreenSize'
import { Swap } from 'pages/Swap'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { CurrencyState } from 'state/swap/SwapContext'
import styled from 'styled-components'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
import { ActivitySection } from './ActivitySection'
import BalanceSummary from './BalanceSummary'
import MobileBalanceSummaryFooter from './MobileBalanceSummaryFooter'
import { TokenDescription } from './TokenDescription'
import { TokenDetailsHeader } from './TokenDetailsHeader'
import { Hr } from './shared'

const DividerLine = styled(Hr)`
  margin-top: 40px;
  margin-bottom: 40px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    opacity: 0;
    margin-bottom: 0;
  }
`

function TDPBreadcrumb() {
  const { address, currency, currencyChain } = useTDPContext()

  const isInfoTDPEnabled = useInfoTDPEnabled()
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()

  return isInfoTDPEnabled ? (
    <BreadcrumbNavContainer isInfoTDPEnabled aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={`/explore/${currencyChain.toLowerCase()}`}>
        <Trans>Explore</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <BreadcrumbNavLink to={`/explore/tokens/${currencyChain.toLowerCase()}`}>
        <Trans>Tokens</Trans> <ChevronRight size={14} />
      </BreadcrumbNavLink>
      <CurrentPageBreadcrumb address={address} currency={currency} />
    </BreadcrumbNavContainer>
  ) : (
    <BreadcrumbNavContainer aria-label="breadcrumb-nav">
      <BreadcrumbNavLink to={`${isInfoExplorePageEnabled ? '/explore' : ''}/tokens/${currencyChain.toLowerCase()}`}>
        <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
      </BreadcrumbNavLink>
    </BreadcrumbNavContainer>
  )
}

function getCurrencyURLAddress(currency?: Currency): string {
  if (!currency) return ''

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
  const { address, currency, currencyChain, warning } = useTDPContext()
  const appChainId = useWeb3React().chainId ?? ChainId.MAINNET
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()
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

      if (!newDefaultToken) return

      const preloadedLogoSrc = getInitialUrl(
        newDefaultToken.wrapped.address,
        newDefaultToken.chainId,
        newDefaultToken.isNative
      )
      const url = getTokenDetailsURL({
        // The function falls back to "NATIVE" if the address is null
        address: newDefaultToken.isNative ? null : newDefaultToken.address,
        chain: currencyChain,
        inputAddress:
          // If only one token was selected before we navigate, then it was the default token and it's being replaced.
          // On the new page, the *new* default token becomes the output, and we don't have another option to set as the input token.
          tokens.inputCurrency && tokens.inputCurrency !== newDefaultToken ? inputCurrencyURLAddress : null,
        isInfoExplorePageEnabled,
      })
      navigate(url, { state: { preloadedLogoSrc } })
    },
    [address, currencyChain, isInfoExplorePageEnabled, navigate]
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
    [continueSwap, setContinueSwap]
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
          disableTokenInputs={currency.chainId !== appChainId}
          compact
        />
      </div>
      {warning && <TokenSafetyMessage tokenAddress={address} warning={warning} />}
      <TokenSafetyModal
        isOpen={openTokenSafetyModal || !!continueSwap}
        tokenAddress={address}
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
      page={InterfacePageName.TOKEN_DETAILS_PAGE}
      properties={{
        tokenAddress: address,
        tokenSymbol: currency.symbol,
        tokenName: currency.name,
        chainId: currency.chainId,
      }}
      shouldLogImpression
    >
      {children}
    </Trace>
  )
}

export default function TokenDetails() {
  const { address, currency, tokenQuery } = useTDPContext()
  const tokenQueryData = tokenQuery.data?.token

  const { lg: isLargeScreenSize } = useScreenSize()
  const isInfoTDPEnabled = useInfoTDPEnabled()

  return (
    <TDPAnalytics>
      <TokenDetailsLayout>
        <LeftPanel>
          <TDPBreadcrumb />
          <TokenInfoContainer isInfoTDPEnabled={isInfoTDPEnabled} data-testid="token-info-container">
            <TokenDetailsHeader />
          </TokenInfoContainer>
          <ChartSection />
          <StatsSection chainId={currency.chainId} address={address} tokenQueryData={tokenQueryData} />
          {!isInfoTDPEnabled && (
            <>
              <Hr />
              <AboutSection />
              <AddressSection />
            </>
          )}
          {isInfoTDPEnabled && (
            <>
              <DividerLine />
              <ActivitySection />
            </>
          )}
        </LeftPanel>
        <RightPanel isInfoTDPEnabled={isInfoTDPEnabled}>
          {isLargeScreenSize && (
            <>
              <TDPSwapComponent />
              <BalanceSummary />
            </>
          )}
          {isInfoTDPEnabled && <TokenDescription />}
        </RightPanel>
        <MobileBalanceSummaryFooter />
      </TokenDetailsLayout>
    </TDPAnalytics>
  )
}
