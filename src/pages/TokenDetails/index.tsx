import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
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
import { WIDGET_WIDTH } from 'components/Widget'
import { isCelo, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { useTokenQuery } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, validateUrlChainParam } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useAtomValue } from 'jotai/utils'
import useCurrencyBalance, { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

import TokenDetailsWidget from './TokenDetailsWidget'

const Hr = styled.hr`
  background-color: ${({ theme }) => theme.textSecondary};
  opacity: 24%;
  border: none;
  height: 0.5px;
`
export const TokenDetailsLayout = styled.div`
  display: flex;
  padding: 0 8px;
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
  const { tokenAddress: address, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const { account } = useWeb3React()
  const currentChainName = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[currentChainName]
  const timePeriod = useAtomValue(filterTimeAtom)
  const isNative = address === 'NATIVE'
  const nativeCurrency = nativeOnChain(pageChainId)
  const tokenQueryAddress = isNative ? nativeCurrency.wrapped.address : address
  const [tokenQueryData, prices] = useTokenQuery(tokenQueryAddress ?? '', currentChainName, timePeriod)
  const token = useMemo(() => {
    if (!tokenQueryData) return
    if (isNative) return nativeCurrency
    return new Token(pageChainId, address ?? '', 18, tokenQueryData?.symbol ?? '', tokenQueryData?.name ?? '')
  }, [tokenQueryData, isNative, nativeCurrency, pageChainId, address])

  const nativeCurrencyBalance = useCurrencyBalance(account, nativeCurrency)
  const tokenBalance = useTokenBalance(account, token?.wrapped)

  const tokenWarning = address ? checkWarning(address) : null
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

  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(address, pageChainId) && tokenWarning !== null
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
    <TokenDetailsLayout>
      {tokenQueryData && (
        <>
          <LeftPanel>
            <BreadcrumbNavLink to={`/tokens/${chainName}`}>
              <ArrowLeft size={14} /> Tokens
            </BreadcrumbNavLink>
            <ChartSection
              token={tokenQueryData}
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
            {/* TODO: The widget does not yet support CELO. */}
            <TokenDetailsWidget token={!isCelo(pageChainId) ? token : undefined} onReviewSwap={onReviewSwap} />
            {tokenWarning && <TokenSafetyMessage tokenAddress={tokenQueryData.address ?? ''} warning={tokenWarning} />}
            <BalanceSummary
              tokenAmount={tokenBalance}
              nativeCurrencyAmount={nativeCurrencyBalance}
              isNative={isNative}
            />
          </RightPanel>

          <MobileBalanceSummaryFooter
            tokenAmount={tokenBalance}
            nativeCurrencyAmount={nativeCurrencyBalance}
            isNative={isNative}
          />

          <TokenSafetyModal
            isOpen={isBlockedToken || !!continueSwap}
            tokenAddress={tokenQueryData.address}
            onContinue={() => onResolveSwap(true)}
            onBlocked={() => navigate(-1)}
            onCancel={() => onResolveSwap(false)}
            showCancel={true}
          />
        </>
      )}
    </TokenDetailsLayout>
  )
}
