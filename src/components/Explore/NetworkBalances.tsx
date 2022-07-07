import { CHAIN_INFO } from 'constants/chainInfo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { isChainAllowed } from 'utils/switchChain'

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
const TotalBalanceItem = styled.div`
  display: flex;
`

export default function NetworkBalances({ address }: { address: string }) {
  const tokenSymbol = useToken(address)?.symbol
  const currency = useCurrency(address)

  const { connector, account, chainId } = useActiveWeb3React()
  const currencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const fiatValue = Number(useUSDCValue(currencyBalance)?.toFixed())
  const totalBalance = formatCurrencyAmount(currencyBalance, 4)
  if (!chainId || !fiatValue || !isChainAllowed(connector, chainId)) return null
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
