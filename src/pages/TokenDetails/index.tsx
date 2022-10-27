import { Currency, Token } from '@uniswap/sdk-core'
import { PageName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import { filterTimeAtom } from 'components/Tokens/state'
import { AboutSection } from 'components/Tokens/TokenDetails/About'
import AddressSection from 'components/Tokens/TokenDetails/AddressSection'
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import { BreadcrumbNavLink } from 'components/Tokens/TokenDetails/BreadcrumbNavLink'
import ChartSection from 'components/Tokens/TokenDetails/ChartSection'
import MobileBalanceSummaryFooter from 'components/Tokens/TokenDetails/MobileBalanceSummaryFooter'
import TokenDetailsSkeleton, {
  Hr,
  LeftPanel,
  RightPanel,
  TokenDetailsLayout,
} from 'components/Tokens/TokenDetails/Skeleton'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import Widget from 'components/Widget'
import { DEFAULT_ERC20_DECIMALS, NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { QueryToken, useTokenQuery } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, validateUrlChainParam } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'

export default function TokenDetails() {
  const { tokenAddress, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const chain = validateUrlChainParam(chainName)
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]
  const nativeCurrency = nativeOnChain(pageChainId)
  const timePeriod = useAtomValue(filterTimeAtom)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [tokenQueryData, prices] = useTokenQuery(
    isNative ? nativeCurrency.wrapped.address : tokenAddress ?? '',
    chain,
    timePeriod
  )
  const token = useMemo(() => {
    if (!tokenAddress) return undefined
    if (isNative) return nativeCurrency
    if (tokenQueryData) return new QueryToken(tokenQueryData)
    return new Token(pageChainId, tokenAddress, DEFAULT_ERC20_DECIMALS)
  }, [isNative, nativeCurrency, pageChainId, tokenAddress, tokenQueryData])

  const tokenWarning = tokenAddress ? checkWarning(tokenAddress) : null
  const isBlockedToken = tokenWarning?.canProceed === false

  const navigate = useNavigate()
  // Wrapping navigate in a transition prevents Suspense from unnecessarily showing fallbacks again.
  const [isPending, startTransition] = useTransition()
  const navigateToTokenForChain = useCallback(
    (chain: Chain) => {
      const chainName = chain.toLowerCase()
      const token = tokenQueryData?.project?.tokens.find((token) => token.chain === chain && token.address)
      const address = isNative ? NATIVE_CHAIN_ID : token?.address
      if (!address) return
      startTransition(() => navigate(`/tokens/${chainName}/${address}`))
    },
    [isNative, navigate, tokenQueryData?.project?.tokens]
  )
  useOnGlobalChainSwitch(navigateToTokenForChain)
  const navigateToWidgetSelectedToken = useCallback(
    (input: Currency | undefined, output: Currency | undefined) => {
      const update = output || input
      if (!token || !update || input?.equals(token) || output?.equals(token)) return
      const address = update.isNative ? NATIVE_CHAIN_ID : update.address
      startTransition(() => navigate(`/tokens/${chainName}/${address}`))
    },
    [chainName, navigate, token]
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

  return (
    <Trace page={PageName.TOKEN_DETAILS_PAGE} properties={{ tokenAddress, tokenName: chainName }} shouldLogImpression>
      <TokenDetailsLayout>
        {tokenQueryData && !isPending ? (
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
            defaultToken={token ?? nativeCurrency}
            onTokensChange={navigateToWidgetSelectedToken}
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
