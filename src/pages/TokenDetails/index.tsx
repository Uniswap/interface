import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from 'components/Tokens/constants'
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

export const TokenDetailsLayout = styled.div`
  display: flex;
  gap: 60px;
  padding: 68px 20px;
  width: 100%;
  justify-content: center;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    gap: 40px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    gap: 0px;
  }

  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    padding-left: 16px;
    padding-right: 16px;
  }

  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    padding-left: 8px;
    padding-right: 8px;
  }
`
export const LeftPanel = styled.div`
  flex: 1;
  max-width: 780px;
  overflow: hidden;
`
export const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: ${WIDGET_WIDTH}px;

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

export default function TokenDetails() {
  const { tokenAddress: tokenAddressParam, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const { account } = useWeb3React()
  const currentChainName = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[currentChainName]
  const nativeCurrency = nativeOnChain(pageChainId)
  const timePeriod = useAtomValue(filterTimeAtom)
  const isNative = tokenAddressParam === 'NATIVE'
  const tokenQueryAddress = isNative ? nativeCurrency.wrapped.address : tokenAddressParam
  const [tokenQueryData, prices] = useTokenQuery(tokenQueryAddress ?? '', currentChainName, timePeriod)

  const pageToken = useMemo(
    () =>
      tokenQueryData && !isNative
        ? new Token(
            CHAIN_NAME_TO_CHAIN_ID[currentChainName],
            tokenAddressParam ?? '',
            18,
            tokenQueryData?.symbol ?? '',
            tokenQueryData?.name ?? ''
          )
        : undefined,
    [currentChainName, isNative, tokenAddressParam, tokenQueryData]
  )

  const nativeCurrencyBalance = useCurrencyBalance(account, nativeCurrency)

  const tokenBalance = useTokenBalance(account, isNative ? nativeCurrency.wrapped : pageToken)

  const tokenWarning = tokenAddressParam ? checkWarning(tokenAddressParam) : null
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

  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(tokenAddressParam, pageChainId) && tokenWarning !== null
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

  const widgetToken = useMemo(() => {
    if (pageToken) {
      return pageToken
    }
    if (nativeCurrency) {
      if (isCelo(pageChainId)) return undefined
      return nativeCurrency
    }
    return undefined
  }, [nativeCurrency, pageChainId, pageToken])

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
            <AboutSection
              address={tokenQueryData.address ?? ''}
              description={tokenQueryData.project?.description}
              homepageUrl={tokenQueryData.project?.homepageUrl}
              twitterName={tokenQueryData.project?.twitterName}
            />
            <AddressSection address={tokenQueryData.address ?? ''} />
          </LeftPanel>
          <RightPanel>
            <Widget defaultToken={widgetToken} onReviewSwapClick={onReviewSwap} />
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
