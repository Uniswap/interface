import { CHAIN_INFO } from 'constants/chainInfo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { useUSDCValue } from '../../hooks/useUSDCPrice'

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
const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
`
const Logo = styled.img`
  height: 32px;
  width: 32px;
  margin-right: 8px;
`
const NetworkBalancesSection = styled.div`
  height: fit-content;
`
const Network = styled.span`
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.primary1};
`
const SingleNetworkBalanceContainer = styled.div`
  display: flex;
  padding-top: 16px;
  align-items: center;
`
const SingleNetworkBalance = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  line-height: 24px;
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

/*
  <TotalBalanceSection>
        Your balance across all networks
        <TotalBalance>
          <TotalBalanceItem>{`${totalBalance} ${tokenSymbol}`}</TotalBalanceItem>{' '}
          <TotalBalanceItem>$4,210.12</TotalBalanceItem>
        </TotalBalance>
      </TotalBalanceSection>
      <NetworkBalancesSection>Your balances by network</NetworkBalancesSection>
  */

export default function NetworkBalances({ address }: { address: string }) {
  const tokenSymbol = useToken(address)?.symbol
  const currency = useCurrency(address)

  const { account, chainId } = useActiveWeb3React()
  const currencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const fiatValue = Number(useUSDCValue(currencyBalance)?.toFixed())
  const totalBalance = formatCurrencyAmount(currencyBalance, 4)
  if (!chainId || totalBalance === '0') return null
  const { label, logoUrl } = CHAIN_INFO[chainId]

  return (
    <BalancesCard>
      Your balance on {label}
      <SingleNetworkBalanceContainer>
        <Logo src={logoUrl} />
        <SingleNetworkBalance>
          <BalanceRow>
            <TotalBalanceItem>{`${totalBalance} ${tokenSymbol}`}</TotalBalanceItem>
            <TotalBalanceItem>${fiatValue}</TotalBalanceItem>
          </BalanceRow>
          <Network>{label}</Network>
        </SingleNetworkBalance>
      </SingleNetworkBalanceContainer>
    </BalancesCard>
  )
}
