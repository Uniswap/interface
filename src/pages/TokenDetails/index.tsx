import { useWeb3React } from '@web3-react/core'
import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from 'components/Tokens/constants'
import BalanceSummary from 'components/Tokens/TokenDetails/BalanceSummary'
import FooterBalanceSummary from 'components/Tokens/TokenDetails/FooterBalanceSummary'
import LoadingTokenDetail from 'components/Tokens/TokenDetails/LoadingTokenDetail'
import NetworkBalance from 'components/Tokens/TokenDetails/NetworkBalance'
import TokenDetail from 'components/Tokens/TokenDetails/TokenDetail'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import Widget, { WIDGET_WIDTH } from 'components/Widget'
import { getChainInfo } from 'constants/chainInfo'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, SupportedChainId, TESTNET_CHAIN_IDS } from 'constants/chains'
import { checkWarning } from 'constants/tokenSafety'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useMemo } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'

const Footer = styled.div`
  display: none;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: flex;
  }
`
const TokenDetailsLayout = styled.div`
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
const RightPanel = styled.div`
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
  const location = useLocation()
  const { tokenAddress } = useParams<{ tokenAddress?: string }>()
  const token = useToken(tokenAddress)

  const tokenWarning = token ? checkWarning(token.address) : null
  /* network balance handling */

  const { data: networkData } = NetworkBalances(token?.address)
  const { chainId: connectedChainId } = useWeb3React()
  const totalBalance = 4.3 // dummy data

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
            tokenSymbol={token?.symbol}
            fiatValue={fiatValue.toSignificant(2)}
            label={chainInfo.label}
            networkColor={networkColor}
          />
        )
      })
    : null

  if (token === undefined) {
    return <Navigate to={{ ...location, pathname: '/tokens' }} replace />
  }

  return (
    <TokenDetailsLayout>
      {token && (
        <>
          <TokenDetail address={token.address} />
          <RightPanel>
            <Widget defaultToken={token ?? undefined} />
            {tokenWarning && <TokenSafetyMessage tokenAddress={token.address} warning={tokenWarning} />}
            <BalanceSummary address={token.address} totalBalance={totalBalance} networkBalances={balancesByNetwork} />
          </RightPanel>
          <Footer>
            <FooterBalanceSummary
              address={token.address}
              totalBalance={totalBalance}
              networkBalances={balancesByNetwork}
            />
          </Footer>
        </>
      )}
    </TokenDetailsLayout>
  )
}

export function LoadingTokenDetails() {
  return (
    <TokenDetailsLayout>
      <LoadingTokenDetail />
      <RightPanel></RightPanel>
      <Footer />
    </TokenDetailsLayout>
  )
}
