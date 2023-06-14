import { Trans } from '@lingui/macro'
import { Currency } from '@pollum-io/widgets'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import TokenDetailsSkeleton, {
  LeftPanel,
  RightPanel,
  TokenDetailsLayout,
  TokenInfoContainer,
  TokenNameCell,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { TokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { Chain } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import { TokenData } from 'graphql/tokens/TokenData'
import Swap from 'pages/Swap'
import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Link as NativeLink } from 'react-router-dom'
import styled, { css } from 'styled-components/macro'
import { isAddress } from 'utils'

import BalanceSummary from './BalanceSummary'
import { OnChangeTimePeriod } from './ChartSection'
import InvalidTokenDetails from './InvalidTokenDetails'
import MobileBalanceSummaryFooter from './MobileBalanceSummaryFooter'
import ShareButton from './ShareButton'

const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

const SwapCss = css`
  * {
    pointer-events: none;
  }
  filter: blur(2px);

  &:hover {
    transform: translateY(-4px);
    transition: ${({ theme }) => `transform ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  }
`
const LandingSwap = styled(Swap)`
  ${SwapCss}
  &:hover {
    border: 1px solid ${({ theme }) => theme.accentAction};
  }
`
const LinkCss = css`
  text-decoration: none;
  max-width: 480px;
  width: 100%;
`

const Link = styled(NativeLink)`
  ${LinkCss}
`

type TokenDetailsProps = {
  urlAddress: string | undefined
  chain: Chain
  tokenPriceQuery?: TokenPriceQuery
  tokenData: TokenData
  onChangeTimePeriod: OnChangeTimePeriod
}

export default function TokenDetails({
  urlAddress,
  chain,
  tokenPriceQuery,
  tokenData,
  onChangeTimePeriod,
}: TokenDetailsProps) {
  if (!urlAddress) {
    throw new Error('Invalid token details route: tokenAddress param is undefined')
  }
  const address = useMemo(
    () => (urlAddress === NATIVE_CHAIN_ID ? urlAddress : isAddress(urlAddress) || undefined),
    [urlAddress]
  )

  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]

  const tokenWarning = address ? checkWarning(address) : null
  const isBlockedToken = tokenWarning?.canProceed === false

  const currencyToken = { address: tokenData.address, symbol: tokenData.symbol, isNative: false } as Currency

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  const [openTokenSafetyModal, setOpenTokenSafetyModal] = useState(false)

  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap, setContinueSwap]
  )
  // address will never be undefined if token is defined; address is checked here to appease typechecker
  if (!tokenData || !address) {
    return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!address} />
  }

  return (
    <TokenDetailsLayout>
      {tokenData ? (
        <LeftPanel>
          <BreadcrumbNavLink to={`/tokens/${chain.toLowerCase()}`}>
            <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
          </BreadcrumbNavLink>
          <TokenInfoContainer data-testid="token-info-container">
            <TokenNameCell>
              <CurrencyLogo currency={currencyToken} size="32px" hideL2Icon={false} />

              {tokenData.name ?? <Trans>Name not found</Trans>}
              <TokenSymbol>{tokenData.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
            </TokenNameCell>
            <TokenActions>
              <ShareButton currency={currencyToken} />
            </TokenActions>
          </TokenInfoContainer>
          <ChartSection tokenPriceQuery={tokenPriceQuery} onChangeTimePeriod={onChangeTimePeriod} />

          <StatsSection
            chainId={pageChainId}
            address={address}
            TVL={tokenData.tvlUSD}
            volume24H={tokenData?.volumeUSD}
            // priceHigh52W={tokenQueryData?.market?.priceHigh52W?.value}
            // priceLow52W={tokenQueryData?.market?.priceLow52W?.value}
          />
          {/* <Hr /> */}
          {/* <AboutSection
            address={address}
            chainId={pageChainId}
            description={tokenQueryData?.project?.description}
            homepageUrl={tokenQueryData?.project?.homepageUrl}
            twitterName={tokenQueryData?.project?.twitterName}
          /> */}
          {/* {!detailedToken.isNative && <AddressSection address={address} />} */}
        </LeftPanel>
      ) : (
        <TokenDetailsSkeleton />
      )}

      <RightPanel onClick={() => isBlockedToken && setOpenTokenSafetyModal(true)}>
        <div style={{ pointerEvents: isBlockedToken ? 'none' : 'auto' }}>
          <Link to="/swap">
            <LandingSwap />
          </Link>
        </div>
        {tokenWarning && <TokenSafetyMessage tokenAddress={address} warning={tokenWarning} />}
        {currencyToken && <BalanceSummary token={currencyToken} />}
      </RightPanel>
      {currencyToken && <MobileBalanceSummaryFooter token={currencyToken} />}

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
    </TokenDetailsLayout>
  )
}
