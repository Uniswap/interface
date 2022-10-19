import { useWeb3React } from '@web3-react/core'
import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import { filterTimeAtom } from 'components/Tokens/state'
import { AboutSection } from 'components/Tokens/TokenDetails/About'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import MobileBalanceSummaryFooter from 'components/Tokens/TokenDetails/MobileBalanceSummaryFooter'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import Widget, { WIDGET_WIDTH } from 'components/Widget'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { useTokenQuery } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, validateUrlChainParam } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useAtomValue } from 'jotai/utils'
import { useTokenFromQuery } from 'lib/hooks/useCurrency'
import useCurrencyBalance, { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { useCallback, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const Hr = styled.hr`
  background-color: ${({ theme }) => theme.textSecondary};
  opacity: 24%;
  border: none;
  height: 0.5px;
`
export const TokenDetailsLayout = styled.div`
  display: flex;
  padding: 0 8px 52px;
  justify-content: center;
  width: 100%;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    gap: 16px;
    padding: 0 16px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    gap: 20px;
    padding: 48px 20px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.xl}px) {
    gap: 40px;
  }
`
export const LeftPanel = styled.div`
  flex: 1;
  max-width: 780px;
  overflow: hidden;
`
export const RightPanel = styled.div`
  display: none;
  flex-direction: column;
  gap: 20px;
  width: ${WIDGET_WIDTH}px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: flex;
  }
`

export default function TokenDetails() {
  const { tokenAddress, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const { account } = useWeb3React()
  const currentChainName = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[currentChainName]
  const nativeCurrency = nativeOnChain(pageChainId)
  const timePeriod = useAtomValue(filterTimeAtom)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [tokenQueryData, prices] = useTokenQuery(
    isNative ? nativeCurrency.wrapped.address : tokenAddress ?? '',
    currentChainName,
    timePeriod
  )
  const queryToken = useTokenFromQuery(isNative ? undefined : { ...tokenQueryData, chainId: pageChainId })
  const token = isNative ? nativeCurrency : queryToken
  const tokenQueryAddress = isNative ? nativeCurrency.wrapped.address : tokenAddress

  const nativeCurrencyBalance = useCurrencyBalance(account, nativeCurrency)
  const tokenBalance = useTokenBalance(account, token?.wrapped)

  const tokenWarning = tokenAddress ? checkWarning(tokenAddress) : null
  const isBlockedToken = tokenWarning?.canProceed === false

  const navigate = useNavigate()
  const switchChains = useCallback(
    (newChain: Chain) => {
      const chainSegment = newChain.toLowerCase()
      if (isNative) {
        navigate(`/tokens/${chainSegment}/NATIVE`)
      } else {
        tokenQueryData?.project?.tokens?.forEach((token) => {
          if (token.chain === newChain && token.address) {
            navigate(`/tokens/${chainSegment}/${token.address}`)
          }
        })
      }
    },
    [isNative, navigate, tokenQueryData?.project?.tokens]
  )
  useOnGlobalChainSwitch(switchChains)

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(tokenAddress, pageChainId) && tokenWarning !== null
  // Show token safety modal if Swap-reviewing a warning token, at all times if the current token is blocked
  const onReviewSwap = useCallback(
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

  return (
    <Trace page={PageName.TOKEN_DETAILS_PAGE} properties={{ tokenAddress, tokenName: chainName }} shouldLogImpression>
      <TokenDetailsLayout>
        {tokenQueryData && (
          <>
            <LeftPanel>
              <BreadcrumbNavLink to={`/tokens/${chainName}`}>
                <ArrowLeft size={14} /> Tokens
              </BreadcrumbNavLink>
              <ChartSection
                token={tokenQueryData}
                currency={token}
                nativeCurrency={isNative ? nativeCurrency : undefined}
                prices={prices}
              />
              <StatsSection
                TVL={tokenQueryData.market?.totalValueLocked?.value}
                volume24H={tokenQueryData.market?.volume24H?.value}
                priceHigh52W={tokenQueryData.market?.priceHigh52W?.value}
                priceLow52W={tokenQueryData.market?.priceLow52W?.value}
              />
              <Hr />
              <AboutSection
                address={tokenQueryData.address ?? ''}
                description={tokenQueryData.project?.description}
                homepageUrl={tokenQueryData.project?.homepageUrl}
                twitterName={tokenQueryData.project?.twitterName}
              />
              <AddressSection address={tokenQueryData.address ?? ''} />
            </LeftPanel>
            <RightPanel>
              <Widget
                // A null token is still loading, and should not be overridden.
                defaultToken={token === null ? undefined : token ?? nativeCurrency}
                onReviewSwapClick={onReviewSwap}
              />
              {tokenWarning && (
                <TokenSafetyMessage tokenAddress={tokenQueryData.address ?? ''} warning={tokenWarning} />
              )}
              <BalanceSummary
                tokenAmount={tokenBalance}
                nativeCurrencyAmount={nativeCurrencyBalance}
                isNative={isNative}
              />
            </RightPanel>

            {tokenQueryAddress && (
              <MobileBalanceSummaryFooter
                tokenAmount={tokenBalance}
                tokenAddress={tokenQueryAddress}
                nativeCurrencyAmount={nativeCurrencyBalance}
                isNative={isNative}
              />
            )}
          </>
        )}
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
