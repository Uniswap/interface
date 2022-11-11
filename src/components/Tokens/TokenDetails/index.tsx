import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/CurrencyLogo'
import { AboutSection } from 'components/Tokens/TokenDetails/About'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import MobileBalanceSummaryFooter from 'components/Tokens/TokenDetails/MobileBalanceSummaryFooter'
import ShareButton from 'components/Tokens/TokenDetails/ShareButton'
import TokenDetailsSkeleton, {
  Hr,
  LeftPanel,
  RightPanel,
  TokenDetailsLayout,
  TokenInfoContainer,
  TokenNameCell,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import { L2NetworkLogo, LogoContainer } from 'components/Tokens/TokenTable/TokenRow'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import Widget from 'components/Widget'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { DEFAULT_ERC20_DECIMALS, NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { TokenPriceQuery } from 'graphql/data/__generated__/TokenPriceQuery.graphql'
import { Chain, TokenQuery } from 'graphql/data/Token'
import { QueryToken, tokenQuery, TokenQueryData } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import useCurrencyLogoURIs from 'lib/hooks/useCurrencyLogoURIs'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'

import { RefetchPricesFunction } from './ChartSection'

const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

export function useTokenLogoURI(token?: TokenQueryData | TopToken, nativeCurrency?: Token | NativeCurrency) {
  const chainId = token ? CHAIN_NAME_TO_CHAIN_ID[token.chain] : SupportedChainId.MAINNET
  return [
    ...useCurrencyLogoURIs(nativeCurrency),
    ...useCurrencyLogoURIs({ ...token, chainId }),
    token?.project?.logoUrl,
  ][0]
}

type TokenDetailsProps = {
  tokenAddress: string | undefined
  chain: Chain
  tokenQueryReference: PreloadedQuery<TokenQuery>
  priceQueryReference: PreloadedQuery<TokenPriceQuery> | null | undefined
  refetchTokenPrices: RefetchPricesFunction
}
export default function TokenDetails({
  tokenAddress,
  chain,
  tokenQueryReference,
  priceQueryReference,
  refetchTokenPrices,
}: TokenDetailsProps) {
  if (!tokenAddress) {
    throw new Error(`Invalid token details route: tokenAddress param is undefined`)
  }

  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const nativeCurrency = nativeOnChain(pageChainId)
  const isNative = tokenAddress === NATIVE_CHAIN_ID

  const tokenQueryData = usePreloadedQuery(tokenQuery, tokenQueryReference).tokens?.[0]
  const token = useMemo(() => {
    if (isNative) return nativeCurrency
    if (tokenQueryData) return new QueryToken(tokenQueryData)
    return new Token(pageChainId, tokenAddress, DEFAULT_ERC20_DECIMALS)
  }, [isNative, nativeCurrency, pageChainId, tokenAddress, tokenQueryData])

  const tokenWarning = tokenAddress ? checkWarning(tokenAddress) : null
  const isBlockedToken = tokenWarning?.canProceed === false

  const navigate = useNavigate()
  // Wrapping navigate in a transition prevents Suspense from unnecessarily showing fallbacks again.
  const [isPending, startTokenTransition] = useTransition()
  const navigateToTokenForChain = useCallback(
    (chain: Chain) => {
      const chainName = chain.toLowerCase()
      const token = tokenQueryData?.project?.tokens.find((token) => token.chain === chain && token.address)
      const address = isNative ? NATIVE_CHAIN_ID : token?.address
      if (!address) return
      startTokenTransition(() => navigate(`/tokens/${chainName}/${address}`))
    },
    [isNative, navigate, startTokenTransition, tokenQueryData?.project?.tokens]
  )
  useOnGlobalChainSwitch(navigateToTokenForChain)
  const navigateToWidgetSelectedToken = useCallback(
    (token: Currency) => {
      const address = token.isNative ? NATIVE_CHAIN_ID : token.address
      startTokenTransition(() => navigate(`/tokens/${chain.toLowerCase()}/${address}`))
    },
    [chain, navigate]
  )

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  // Show token safety modal if Swap-reviewing a warning token, at all times if the current token is blocked
  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(tokenAddress, pageChainId) && tokenWarning !== null
  const onReviewSwapClick = useCallback(
    () => new Promise<boolean>((resolve) => (shouldShowSpeedbump ? setContinueSwap({ resolve }) : resolve(true))),
    [shouldShowSpeedbump]
  )

  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap, setContinueSwap]
  )

  const logoSrc = useTokenLogoURI(tokenQueryData, isNative ? nativeCurrency : undefined)
  const L2Icon = getChainInfo(pageChainId)?.circleLogoUrl

  return (
    <Trace page={PageName.TOKEN_DETAILS_PAGE} properties={{ tokenAddress, tokenName: token?.name }} shouldLogImpression>
      <TokenDetailsLayout>
        {tokenQueryData && !isPending ? (
          <LeftPanel>
            <BreadcrumbNavLink to={`/tokens/${chain.toLowerCase()}`}>
              <ArrowLeft size={14} /> Tokens
            </BreadcrumbNavLink>
            <TokenInfoContainer>
              <TokenNameCell>
                <LogoContainer>
                  <CurrencyLogo
                    src={logoSrc}
                    size={'32px'}
                    symbol={isNative ? nativeCurrency?.symbol : token?.symbol}
                    currency={isNative ? nativeCurrency : token}
                  />
                  <L2NetworkLogo networkUrl={L2Icon} size={'16px'} />
                </LogoContainer>
                {token?.name ?? <Trans>Name not found</Trans>}
                <TokenSymbol>{token?.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
              </TokenNameCell>
              <TokenActions>
                {tokenQueryData?.name && tokenQueryData.symbol && tokenQueryData.address && (
                  <ShareButton token={tokenQueryData} isNative={!!nativeCurrency} />
                )}
              </TokenActions>
            </TokenInfoContainer>
            <ChartSection priceQueryReference={priceQueryReference} refetchTokenPrices={refetchTokenPrices} />
            <StatsSection
              TVL={tokenQueryData.market?.totalValueLocked?.value}
              volume24H={tokenQueryData.market?.volume24H?.value}
              priceHigh52W={tokenQueryData.market?.priceHigh52W?.value}
              priceLow52W={tokenQueryData.market?.priceLow52W?.value}
            />
            {!isNative && (
              <>
                <Hr />
                <AboutSection
                  address={tokenQueryData.address ?? ''}
                  description={tokenQueryData.project?.description}
                  homepageUrl={tokenQueryData.project?.homepageUrl}
                  twitterName={tokenQueryData.project?.twitterName}
                />
                <AddressSection address={tokenQueryData.address ?? ''} />
              </>
            )}
          </LeftPanel>
        ) : (
          <TokenDetailsSkeleton />
        )}

        <RightPanel>
          <Widget
            token={token ?? nativeCurrency}
            onTokenChange={navigateToWidgetSelectedToken}
            onReviewSwapClick={onReviewSwapClick}
          />
          {tokenWarning && <TokenSafetyMessage tokenAddress={tokenAddress ?? ''} warning={tokenWarning} />}
          {token && <BalanceSummary token={token} />}
        </RightPanel>
        {token && <MobileBalanceSummaryFooter token={token} />}

        {tokenAddress && (
          <TokenSafetyModal
            isOpen={isBlockedToken || !!continueSwap}
            tokenAddress={tokenAddress}
            onContinue={() => onResolveSwap(true)}
            onBlocked={() => navigate(-1)}
            onCancel={() => onResolveSwap(false)}
            showCancel={true}
          />
        )}
      </TokenDetailsLayout>
    </Trace>
  )
}
