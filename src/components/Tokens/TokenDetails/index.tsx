import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
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
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { TokenPriceQuery } from 'graphql/data/__generated__/types-and-hooks'
import { Chain, TokenQuery, TokenQueryData } from 'graphql/data/Token'
import { QueryToken } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, getTokenDetailsURL } from 'graphql/data/util'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { UNKNOWN_TOKEN_SYMBOL, useTokenFromActiveNetwork } from 'lib/hooks/useCurrency'
import { Swap } from 'pages/Swap'
import { useCallback, useMemo, useState, useTransition } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Field } from 'state/swap/actions'
import { SwapState } from 'state/swap/reducer'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'

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
  urlAddress?: string
  inputTokenAddress?: string
  chain: Chain
  tokenQuery: TokenQuery
  tokenPriceQuery?: TokenPriceQuery
  onChangeTimePeriod: OnChangeTimePeriod
}
export default function TokenDetails({
  urlAddress,
  inputTokenAddress,
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

  const { chainId: connectedChainId } = useWeb3React()
  const pageChainId = CHAIN_NAME_TO_CHAIN_ID[chain]

  const tokenQueryData = tokenQuery.token
  const crossChainMap = useMemo(
    () =>
      tokenQueryData?.project?.tokens.reduce((map, current) => {
        if (current) map[current.chain] = current.address
        return map
      }, {} as { [key: string]: string | undefined }) ?? {},
    [tokenQueryData]
  )

  const { token: detailedToken, didFetchFromChain } = useRelevantToken(address, pageChainId, tokenQueryData)

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
        startTokenTransition(() => navigate(getTokenDetailsURL({ address: bridgedAddress, chain: update })))
      } else if (didFetchFromChain || detailedToken?.isNative) {
        startTokenTransition(() => navigate(getTokenDetailsURL({ address, chain: update })))
      }
    },
    [address, crossChainMap, didFetchFromChain, navigate, detailedToken?.isNative]
  )
  useOnGlobalChainSwitch(navigateToTokenForChain)

  const handleCurrencyChange = useCallback(
    (tokens: Pick<SwapState, Field.INPUT | Field.OUTPUT>) => {
      if (
        addressesAreEquivalent(tokens[Field.INPUT]?.currencyId, address) ||
        addressesAreEquivalent(tokens[Field.OUTPUT]?.currencyId, address)
      ) {
        return
      }

      const newDefaultTokenID = tokens[Field.OUTPUT]?.currencyId ?? tokens[Field.INPUT]?.currencyId
      startTokenTransition(() =>
        navigate(
          getTokenDetailsURL({
            // The function falls back to "NATIVE" if the address is null
            address: newDefaultTokenID === 'ETH' ? null : newDefaultTokenID,
            chain,
            inputAddress:
              // If only one token was selected before we navigate, then it was the default token and it's being replaced.
              // On the new page, the *new* default token becomes the output, and we don't have another option to set as the input token.
              tokens[Field.INPUT] && tokens[Field.INPUT]?.currencyId !== newDefaultTokenID
                ? tokens[Field.INPUT]?.currencyId
                : null,
          })
        )
      )
    },
    [address, chain, navigate]
  )

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
  if (detailedToken === undefined || !address) {
    return <InvalidTokenDetails pageChainId={pageChainId} isInvalidAddress={!address} />
  }
  return (
    <Trace
      page={InterfacePageName.TOKEN_DETAILS_PAGE}
      properties={{ tokenAddress: address, tokenName: detailedToken?.name }}
      shouldLogImpression
    >
      <TokenDetailsLayout>
        {detailedToken && !isPending ? (
          <LeftPanel>
            <BreadcrumbNavLink to={`/tokens/${chain.toLowerCase()}`}>
              <ArrowLeft data-testid="token-details-return-button" size={14} /> Tokens
            </BreadcrumbNavLink>
            <TokenInfoContainer data-testid="token-info-container">
              <TokenNameCell>
                <CurrencyLogo currency={detailedToken} size="32px" hideL2Icon={false} />

                {detailedToken.name ?? <Trans>Name not found</Trans>}
                <TokenSymbol>{detailedToken.symbol ?? <Trans>Symbol not found</Trans>}</TokenSymbol>
              </TokenNameCell>
              <TokenActions>
                <ShareButton currency={detailedToken} />
              </TokenActions>
            </TokenInfoContainer>
            <ChartSection tokenPriceQuery={tokenPriceQuery} onChangeTimePeriod={onChangeTimePeriod} />

            <StatsSection
              chainId={pageChainId}
              address={address}
              TVL={tokenQueryData?.market?.totalValueLocked?.value}
              volume24H={tokenQueryData?.market?.volume24H?.value}
              priceHigh52W={tokenQueryData?.market?.priceHigh52W?.value}
              priceLow52W={tokenQueryData?.market?.priceLow52W?.value}
            />
            <Hr />
            <AboutSection
              address={address}
              chainId={pageChainId}
              description={tokenQueryData?.project?.description}
              homepageUrl={tokenQueryData?.project?.homepageUrl}
              twitterName={tokenQueryData?.project?.twitterName}
            />
            {!detailedToken.isNative && <AddressSection address={address} />}
          </LeftPanel>
        ) : (
          <TokenDetailsSkeleton />
        )}

        <RightPanel onClick={() => isBlockedToken && setOpenTokenSafetyModal(true)}>
          <div style={{ pointerEvents: isBlockedToken ? 'none' : 'auto' }}>
            <Swap
              chainId={pageChainId}
              prefilledState={{
                [Field.INPUT]: { currencyId: inputTokenAddress },
                [Field.OUTPUT]: { currencyId: address === NATIVE_CHAIN_ID ? 'ETH' : address },
              }}
              onCurrencyChange={handleCurrencyChange}
              disableTokenInputs={pageChainId !== connectedChainId}
            />
          </div>
          {tokenWarning && <TokenSafetyMessage tokenAddress={address} warning={tokenWarning} />}
          {detailedToken && <BalanceSummary token={detailedToken} />}
        </RightPanel>
        {detailedToken && <MobileBalanceSummaryFooter token={detailedToken} />}

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
    </Trace>
  )
}
