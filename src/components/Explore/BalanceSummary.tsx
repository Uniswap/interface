import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { getChainInfo, getChainInfoOrDefault } from 'constants/chainInfo'
import { L1_CHAIN_IDS, L2_CHAIN_IDS, SupportedChainId, TESTNET_CHAIN_IDS } from 'constants/chains'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useMemo } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { isChainAllowed } from 'utils/switchChain'

import NetworkBalance from './NetworkBalance'

const BalancesCard = styled.div`
  width: 284px;
  height: fit-content;
  color: ${({ theme }) => theme.deprecate_text1};
  font-size: 12px;
  line-height: 20px;
  padding: 20px;
  background-color: ${({ theme }) => theme.deprecate_bg1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.deprecate_bg3};
`
const NetworkBalancesSection = styled.div`
  height: fit-content;
`
const TotalBalanceSection = styled.div`
  height: fit-content;
  border-bottom: 1px solid ${({ theme }) => theme.deprecate_bg3};
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

  return (
    <BalancesCard>
      {loading ? (
        <span>loading...</span>
      ) : error ? (
        <p>
          <Trans>Error fetching user balances</Trans>
        </p>
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
                  networkColor={theme.primary1}
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
            networkColor={theme.primary1}
          />
        </>
      )}
    </BalancesCard>
  )
}
