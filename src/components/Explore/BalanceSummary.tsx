import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { CHAIN_INFO } from 'constants/chainInfo'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import styled, { useTheme } from 'styled-components/macro'
import { isChainAllowed } from 'utils/switchChain'

import NetworkBalance from './NetworkBalance'

const BalancesCard = styled.div`
  width: 284px;
  height: fit-content;
  color: ${({ theme }) => theme.text1};
  font-size: 12px;
  line-height: 20px;
  padding: 20px;
  background-color: ${({ theme }) => theme.bg1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.bg3};
`
const NetworkBalancesSection = styled.div`
  height: fit-content;
`
const TotalBalanceSection = styled.div`
  height: fit-content;
  border-bottom: 1px solid ${({ theme }) => theme.bg3};
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

  const { label: connectedLabel, logoUrl: connectedLogoUrl } = CHAIN_INFO[connectedChainId || 1]
  const connectedFiatValue = 1
  const multipleBalances = true // for testing purposes
  const totalBalance = 4.3

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
            Object.entries(data).map(([chainId, amount]) => {
              const fiatValue = 1010.12 // for testing purposes
              const chain = parseInt(chainId)
              if (!fiatValue || !isChainAllowed(connector, chain)) return null
              const { label, logoUrl } = CHAIN_INFO[chain]
              return (
                <NetworkBalance
                  key={chainId}
                  logoUrl={logoUrl}
                  balance={'1'}
                  tokenSymbol={tokenSymbol ?? 'XXX'}
                  fiatValue={fiatValue}
                  label={label}
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
