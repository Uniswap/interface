import { useWeb3React } from '@web3-react/core'
import {
  LARGE_MEDIA_BREAKPOINT,
  MAX_WIDTH_MEDIA_BREAKPOINT,
  MOBILE_MEDIA_BREAKPOINT,
  SMALL_MEDIA_BREAKPOINT,
} from 'components/Explore/constants'
import BalanceSummary from 'components/Explore/TokenDetails/BalanceSummary'
import FooterBalanceSummary from 'components/Explore/TokenDetails/FooterBalanceSummary'
import LoadingTokenDetail from 'components/Explore/TokenDetails/LoadingTokenDetail'
import NetworkBalance from 'components/Explore/TokenDetails/NetworkBalance'
import TokenDetail from 'components/Explore/TokenDetails/TokenDetail'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import { getChainInfo } from 'constants/chainInfo'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, SupportedChainId, TESTNET_CHAIN_IDS } from 'constants/chains'
import { checkWarning } from 'constants/tokenSafety'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import useTokenDetailPageQuery from 'hooks/useTokenDetailPageQuery'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { isChainAllowed } from 'utils/switchChain'

const Footer = styled.div`
  display: none;
  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: flex;
  }
`
const TokenDetailsLayout = styled.div`
  display: flex;
  gap: 80px;
  padding: 0px 20px;
  width: 100%;
  justify-content: center;

  @media only screen and (max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT}) {
    gap: 40px;
  }
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    padding: 0px 16px;
  }
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    padding: 0px 8px;
  }
`
const RightPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const Widget = styled.div`
  height: 348px;
  width: 284px;
  background-color: ${({ theme }) => theme.backgroundContainer};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`
export default function TokenDetails() {
  const { tokenAddress } = useParams<{ tokenAddress?: string }>()
  const { data, error, loading } = useTokenDetailPageQuery(tokenAddress)
  const theme = useTheme()
  const tokenSymbol = useToken(tokenAddress)?.symbol
  setTimeout(() => {
    setLoading(false)
  }, 1000)
  let tokenDetail
  if (!tokenAddress) {
    // TODO: handle no address / invalid address cases
    tokenDetail = 'invalid token'
  } else if (loadingDetails) {
    tokenDetail = <LoadingTokenDetail />
  } else {
    tokenDetail = <TokenDetail address={tokenAddress} />
  }

  const tokenWarning = tokenAddress ? checkWarning(tokenAddress) : null
  /* network balance handling */
  const { data } = useNetworkTokenBalances({ address: tokenAddress })
  const { connector, chainId: connectedChainId } = useWeb3React()
  const totalBalance = 4.3 // dummy data

  const chainsToList = useMemo(() => {
    let chainIds = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]
    const userConnectedToATestNetwork = connectedChainId && TESTNET_CHAIN_IDS.includes(connectedChainId)
    if (!userConnectedToATestNetwork) {
      chainIds = chainIds.filter((id) => !(TESTNET_CHAIN_IDS as unknown as SupportedChainId[]).includes(id))
    }
    return chainIds
  }, [connectedChainId])

  const balancesByNetwork = data
    ? chainsToList.map((chainId) => {
        const amount = data[chainId]
        const fiatValue = amount // for testing purposes
        if (!fiatValue || !isChainAllowed(connector, chainId)) return null
        const chainInfo = getChainInfo(chainId)
        if (!chainInfo) return null
        return (
          <NetworkBalance
            key={chainId}
            logoUrl={chainInfo.logoUrl}
            balance={'1'}
            tokenSymbol={tokenSymbol ?? 'XXX'}
            fiatValue={fiatValue.toSignificant(2)}
            label={chainInfo.label}
            networkColor={theme.textPrimary}
          />
        )
      })
    : null

  return (
    <TokenDetailsLayout>
      {tokenDetail}
      {tokenAddress && (
        <>
          <RightPanel>
            <Widget />
            {tokenWarning && <TokenSafetyMessage tokenAddress={tokenAddress} warning={tokenWarning} />}
            {!loadingDetails && (
              <BalanceSummary address={tokenAddress} totalBalance={totalBalance} networkBalances={balancesByNetwork} />
            )}
          </RightPanel>
          <Footer>
            {!loadingDetails && (
              <FooterBalanceSummary
                address={tokenAddress}
                totalBalance={totalBalance}
                networkBalances={balancesByNetwork}
              />
            )}
          </Footer>
        </>
      )}
    </TokenDetailsLayout>
  )
}
