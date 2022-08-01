import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo, getChainInfoOrDefault } from 'constants/chainInfo'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, SupportedChainId, TESTNET_CHAIN_IDS } from 'constants/chains'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useMemo } from 'react'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { isChainAllowed } from 'utils/switchChain'

import NetworkBalance from './NetworkBalance'

const BalancesCard = styled.div`
  width: 284px;
  height: fit-content;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 12px;
  line-height: 20px;
  padding: 20px;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`
const ErrorState = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
`
const ErrorText = styled.span`
  display: flex;
  flex-wrap: wrap;
`
const NetworkBalancesSection = styled.div`
  height: fit-content;
`
const TotalBalanceSection = styled.div`
  height: fit-content;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-bottom: 20px;
  padding-bottom: 20px;
`
const TotalBalance = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 20px;
  line-height: 28px;
  margin-top: 12px;
  align-items: center;
`
const TotalBalanceItem = styled.div`
  display: flex;
`

export default function BalanceSummary({ address }: { address: string }) {
  const theme = useTheme()
  const tokenSymbol = useToken(address)?.symbol
  const { loading, error, data } = useNetworkTokenBalances({ address })

  const { connector, chainId: connectedChainId } = useWeb3React()

  const { label: connectedLabel, logoUrl: connectedLogoUrl } = getChainInfoOrDefault(connectedChainId)
  const connectedFiatValue = 1
  const multipleBalances = true // for testing purposes
  const totalBalance = 4.3

  const chainsToList = useMemo(() => {
    let chainIds = [...L1_CHAIN_IDS, ...L2_CHAIN_IDS]
    const userConnectedToATestNetwork = connectedChainId && TESTNET_CHAIN_IDS.includes(connectedChainId)
    if (!userConnectedToATestNetwork) {
      chainIds = chainIds.filter((id) => !(TESTNET_CHAIN_IDS as unknown as SupportedChainId[]).includes(id))
    }
    return chainIds
  }, [connectedChainId])

  if (loading) return null
  return (
    <BalancesCard>
      {error ? (
        <ErrorState>
          <AlertTriangle size={24} />
          <ErrorText>
            <Trans>There was an error loading your {tokenSymbol} balance</Trans>
          </ErrorText>
        </ErrorState>
      ) : multipleBalances ? (
        <>
          <TotalBalanceSection>
            Your balance across all networks
            <TotalBalance>
              <TotalBalanceItem>{`${totalBalance} ${tokenSymbol}`}</TotalBalanceItem>
              <TotalBalanceItem>$4,210.12</TotalBalanceItem>
            </TotalBalance>
          </TotalBalanceSection>
          <NetworkBalancesSection>Your balances by network</NetworkBalancesSection>
          {data &&
            chainsToList.map((chainId) => {
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
                  networkColor={chainInfo.color}
                />
              )
            })}
        </>
      ) : (
        <>
          Your balance on {connectedLabel}
          <NetworkBalance
            logoUrl={connectedLogoUrl}
            balance={'1'}
            tokenSymbol={tokenSymbol ?? 'XXX'}
            fiatValue={connectedFiatValue}
            label={connectedLabel}
            networkColor={theme.textPrimary}
          />
        </>
      )}
    </BalancesCard>
  )
}
