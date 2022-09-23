import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { formatToDecimal } from 'analytics/utils'
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
import FooterBalanceSummary from 'components/Tokens/TokenDetails/FooterBalanceSummary'
import NetworkBalance from 'components/Tokens/TokenDetails/NetworkBalance'
import StatsSection from 'components/Tokens/TokenDetails/StatsSection'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import Widget, { WIDGET_WIDTH } from 'components/Widget'
import { getChainInfo } from 'constants/chainInfo'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, SupportedChainId, TESTNET_CHAIN_IDS } from 'constants/chains'
import { isCelo, nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { checkWarning } from 'constants/tokenSafety'
import { Chain } from 'graphql/data/__generated__/TokenQuery.graphql'
import { useTokenQuery } from 'graphql/data/Token'
import { CHAIN_NAME_TO_CHAIN_ID, validateUrlChainParam } from 'graphql/data/util'
import { useIsUserAddedTokenOnChain } from 'hooks/Tokens'
import { useOnGlobalChainSwitch } from 'hooks/useGlobalChainSwitch'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useAtomValue } from 'jotai/utils'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

export const Footer = styled.div`
  display: none;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: flex;
  }
`
export const TokenDetailsLayout = styled.div`
  display: flex;
  gap: 80px;
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
  max-width: 832px;
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
function NetworkBalances(tokenAddress: string | undefined) {
  return useNetworkTokenBalances({ address: tokenAddress })
}

export default function TokenDetails() {
  const { tokenAddress: tokenAddressParam, chainName } = useParams<{ tokenAddress?: string; chainName?: string }>()
  const chainId = CHAIN_NAME_TO_CHAIN_ID[validateUrlChainParam(chainName)]
  let tokenAddress = tokenAddressParam
  let nativeCurrency
  if (tokenAddressParam === 'NATIVE') {
    nativeCurrency = nativeOnChain(chainId)
    tokenAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address?.toLowerCase()
  }

  const tokenWarning = tokenAddress ? checkWarning(tokenAddress) : null
  const isBlockedToken = tokenWarning?.canProceed === false

  const timePeriod = useAtomValue(filterTimeAtom)
  const currentChainName = validateUrlChainParam(chainName)
  const token = useTokenQuery(tokenAddress ?? '', currentChainName, timePeriod).tokens?.[0]

  const navigate = useNavigate()
  const switchChains = (newChain: Chain) => {
    if (tokenAddressParam === 'NATIVE') {
      navigate(`/tokens/${newChain.toLowerCase()}/NATIVE`)
    } else {
      token?.project?.tokens?.forEach((token) => {
        if (token.chain === newChain && token.address) {
          navigate(`/tokens/${newChain.toLowerCase()}/${token.address}`)
        }
      })
    }
  }
  useOnGlobalChainSwitch(switchChains)

  const [continueSwap, setContinueSwap] = useState<{ resolve: (value: boolean | PromiseLike<boolean>) => void }>()

  // TODO: Make useToken() work on non-mainenet chains or replace this logic
  const shouldShowSpeedbump = !useIsUserAddedTokenOnChain(tokenAddress, chainId) && tokenWarning !== null
  // Show token safety modal if Swap-reviewing a warning token, at all times if the current token is blocked
  const onReviewSwap = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      shouldShowSpeedbump ? setContinueSwap({ resolve }) : resolve(true)
    })
  }, [shouldShowSpeedbump])

  const onResolveSwap = useCallback(
    (value: boolean) => {
      continueSwap?.resolve(value)
      setContinueSwap(undefined)
    },
    [continueSwap, setContinueSwap]
  )

  /* network balance handling */
  const { data: networkData } = NetworkBalances(tokenAddress)
  const { chainId: connectedChainId, account } = useWeb3React()

  // TODO: consider updating useTokenBalance to work with just address/chain to avoid using Token data structure here
  const balanceValue = useTokenBalance(account, new Token(chainId, tokenAddress ?? '', 18))
  const balance = balanceValue ? formatToDecimal(balanceValue, Math.min(balanceValue.currency.decimals, 6)) : undefined
  const balanceUsdValue = useStablecoinValue(balanceValue)?.toFixed(2)
  const balanceUsd = balanceUsdValue ? parseFloat(balanceUsdValue) : undefined

  const chainsToList = useMemo(() => {
    let chainIds = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]
    const userConnectedToATestNetwork = connectedChainId && TESTNET_CHAIN_IDS.includes(connectedChainId)
    if (!userConnectedToATestNetwork) {
      chainIds = chainIds.filter((id) => !(TESTNET_CHAIN_IDS as unknown as SupportedChainId[]).includes(id))
    }
    return chainIds
  }, [connectedChainId])

  const balancesByNetwork = networkData
    ? chainsToList.map((chainId) => {
        const amount = networkData[chainId]
        const fiatValue = amount // for testing purposes
        if (!fiatValue || !token?.symbol) return null
        const chainInfo = getChainInfo(chainId)
        const networkColor = chainInfo.color
        if (!chainInfo) return null
        return (
          <NetworkBalance
            key={chainId}
            logoUrl={chainInfo.logoUrl}
            balance={'1'}
            tokenSymbol={token.symbol}
            fiatValue={fiatValue.toSignificant(2)}
            label={chainInfo.label}
            networkColor={networkColor}
          />
        )
      })
    : null

  const defaultWidgetToken =
    nativeCurrency ??
    (token?.address && token.symbol && token.name
      ? new Token(CHAIN_NAME_TO_CHAIN_ID[currentChainName], token.address, 18, token.symbol, token.name)
      : undefined)

  // TODO: Fix this logic to not automatically redirect on refresh, yet still catch invalid addresses
  //const location = useLocation()
  //if (token === undefined) {
  //  return <Navigate to={{ ...location, pathname: '/tokens' }} replace />
  //}

  return (
    <TokenDetailsLayout>
      {token && (
        <>
          <LeftPanel>
            <BreadcrumbNavLink to={`/tokens/${chainName}`}>
              <ArrowLeft size={14} /> Tokens
            </BreadcrumbNavLink>
            <ChartSection token={token} nativeCurrency={nativeCurrency} />
            <StatsSection
              TVL={token.market?.totalValueLocked?.value}
              volume24H={token.market?.volume24H?.value}
              // TODO: Reenable these values once they're available in schema
              // priceHigh52W={token.market?.priceHigh52W?.value}
              // priceLow52W={token.market?.priceLow52W?.value}
            />
            <AboutSection
              address={token.address ?? ''}
              description={token.project?.description}
              homepageUrl={token.project?.homepageUrl}
              twitterName={token.project?.twitterName}
            />
            <AddressSection address={token.address ?? ''} />
          </LeftPanel>
          <RightPanel>
            <Widget defaultToken={!isCelo(chainId) ? defaultWidgetToken : undefined} onReviewSwapClick={onReviewSwap} />
            {tokenWarning && <TokenSafetyMessage tokenAddress={token.address ?? ''} warning={tokenWarning} />}
            <BalanceSummary address={token.address ?? ''} balance={balance} balanceUsd={balanceUsd} />
          </RightPanel>
          <Footer>
            <FooterBalanceSummary
              address={token.address ?? ''}
              networkBalances={balancesByNetwork}
              balance={balance}
              balanceUsd={balanceUsd}
            />
          </Footer>
          <TokenSafetyModal
            isOpen={isBlockedToken || !!continueSwap}
            tokenAddress={token.address}
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
