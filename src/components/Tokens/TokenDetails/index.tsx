import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { PageName } from '@uniswap/analytics-events'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
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
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { TokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { Chain, TokenQuery, TokenQueryData } from 'graphql/data/Token'
import { QueryToken } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { UNKNOWN_TOKEN_SYMBOL, useTokenFromActiveNetwork } from 'lib/hooks/useCurrency'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'

import { OnChangeTimePeriod } from './ChartSection'
import InvalidTokenDetails from './InvalidTokenDetails'

const TokenSymbol = styled.span`
  text-transform: uppercase;
  color: ${({ theme }) => theme.textSecondary};
`
const TokenActions = styled.div`
  display: flex;
  gap: 16px;
  color: ${({ theme }) => theme.textSecondary};
`

function useOnChainToken(address: string | undefined, skip: boolean) {
  const token = useTokenFromActiveNetwork(skip || !address ? undefined : address)

  if (skip || !address || (token && token?.symbol === UNKNOWN_TOKEN_SYMBOL)) {
    return undefined
  } else {
    return token
  }
}

// Selects most relevant token based on data available, preferring native > query > on-chain
// Token will be null if still loading from on-chain, and undefined if unavailable
function useRelevantToken(
  address: string | undefined,
  pageChainId: number,
  tokenQueryData: TokenQueryData | undefined
) {
  const { chainId: activeChainId } = useWeb3React()
  const queryToken = useMemo(() => {
    if (!address) return undefined
    if (address === NATIVE_CHAIN_ID) return nativeOnChain(pageChainId)
    if (tokenQueryData) return new QueryToken(address, tokenQueryData)
    return undefined
  }, [pageChainId, address, tokenQueryData])
  // fetches on-chain token if query data is missing and page chain matches global chain (else fetch won't work)
  const skipOnChainFetch = Boolean(queryToken) || pageChainId !== activeChainId
  const onChainToken = useOnChainToken(address, skipOnChainFetch)

  return useMemo(
    () => ({ token: queryToken ?? onChainToken, didFetchFromChain: !queryToken }),
    [onChainToken, queryToken]
  )
}

type TokenDetailsProps = {
  urlAddress: string | undefined
  chain: Chain
  tokenQuery: TokenQuery
  tokenPriceQuery: TokenPriceQuery | undefined
  onChangeTimePeriod: OnChangeTimePeriod
}
export default function TokenDetails({
  urlAddress,
  chain,
  tokenQuery,
  tokenPriceQuery,
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

  const tokenQueryData = tokenQuery.tokens?.[0]
  const crossChainMap = useMemo(
    () =>
      tokenQueryData?.project?.tokens.reduce((map, current) => {
        if (current) map[current.chain] = current.address
        return map
      }, {} as { [key: string]: string | undefined }) ?? {},
    [tokenQueryData]
  )

  const { token, didFetchFromChain } = useRelevantToken(address, pageChainId, tokenQueryData)

  const tokenWarning = address ? checkWarning(address) : null
  const isBlockedToken = tokenWarning?.canProceed === false
  const navigate = useNavigate()

  // Wrapping navigate in a transition prevents Suspense from unnecessarily showing fallbacks again.
  const [isPending, startTokenTransition] = useTransition()
  const navigateToTokenForChain = useCallback(
    (update: Chain) => {
      if (!address) return
      const bridgedAddress = crossChainMap[update]
      if (bridgedAddress) {
        startTokenTransition(() => navigate(getTokenDetailsURL(bridgedAddress, update)))
      } else if (didFetchFromChain || token?.isNative) {
        startTokenTransition(() => navigate(getTokenDetailsURL(address, update)))
      }
    },
    [address, crossChainMap, didFetchFromChain, navigate, token?.isNative]
  )
  useOnGlobalChainSwitch(navigateToTokenForChain)

  const navigateToWidgetSelectedToken = useCallback(
    (token: Currency) => {
      const address = token.isNative ? NATIVE_CHAIN_ID : token.address
      startTokenTransition(() => navigate(getTokenDetailsURL(address, chain)))
    },
    [chain, navigate]
  )

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  // Show token safety modal if Swap-reviewing a warning token, at all times if the current token is blocked
  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(address, pageChainId) && tokenWarning !== null
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

  const L2Icon = getChainInfo(pageChainId)?.circleLogoUrl

  // address will never be undefined if token is defined; address is checked here to appease typechecker
  if (token === undefined || !address) {
    return <InvalidTokenDetails chainName={address && getChainInfo(pageChainId)?.label} />
  }
  return (
    <Trace
      page={PageName.TOKEN_DETAILS_PAGE}
      properties={{ tokenAddress: address, tokenName: token?.name }}
      shouldLogImpression
    >
      <TokenDetailsLayout>
        {token && !isPending ? (
          <LeftPanel>
            <BreadcrumbNavLink to={`/tokens/${chain.toLowerCase()}`}>
              <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
            </BreadcrumbNavLink>
            <TokenInfoContainer>
              <TokenNameCell>
                <LogoContainer>
                  <CurrencyLogo currency={token} size="32px" />
                  <L2NetworkLogo networkUrl={L2Icon} size="16px" />
                </LogoContainer>
                {token.name ?? <Trans>Name not found</Trans>}
                <TokenSymbol>{token.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
              </TokenNameCell>
              <TokenActions>
                <ShareButton currency={token} />
              </TokenActions>
            </TokenInfoContainer>
            <ChartSection tokenPriceQuery={tokenPriceQuery} onChangeTimePeriod={onChangeTimePeriod} />
            <StatsSection
              TVL={tokenQueryData?.market?.totalValueLocked?.value}
              volume24H={tokenQueryData?.market?.volume24H?.value}
              priceHigh52W={tokenQueryData?.market?.priceHigh52W?.value}
              priceLow52W={tokenQueryData?.market?.priceLow52W?.value}
            />
            {!token.isNative && (
              <>
                <Hr />
                <AboutSection
                  address={address}
                  description={tokenQueryData?.project?.description}
                  homepageUrl={tokenQueryData?.project?.homepageUrl}
                  twitterName={tokenQueryData?.project?.twitterName}
                />
                <AddressSection address={address} />
              </>
            )}
          </LeftPanel>
        ) : (
          <TokenDetailsSkeleton />
        )}

        <RightPanel>
          <Widget
            token={token ?? undefined}
            onTokenChange={navigateToWidgetSelectedToken}
            onReviewSwapClick={onReviewSwapClick}
          />
          {tokenWarning && <TokenSafetyMessage tokenAddress={address} warning={tokenWarning} />}
          {token && <BalanceSummary token={token} />}
        </RightPanel>
        {token && <MobileBalanceSummaryFooter token={token} />}

        <TokenSafetyModal
          isOpen={isBlockedToken || !!continueSwap}
          tokenAddress={address}
          onContinue={() => onResolveSwap(true)}
          onBlocked={() => navigate(-1)}
          onCancel={() => onResolveSwap(false)}
          showCancel={true}
        />
      </TokenDetailsLayout>
    </Trace>
  )
}
