import { CHAIN_INFO } from 'constants/chainInfo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { isChainAllowed } from 'utils/switchChain'

// import { useUSDCValue } from '../../hooks/useUSDCPrice'
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
  const tokenSymbol = useToken(address)?.symbol
  const currency = useCurrency(address)

  const { connector, account, chainId } = useActiveWeb3React()
  const currencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  // const fiatValue = Number(useUSDCValue(currencyBalance)?.toFixed())
  const fiatValue = 1010.12 // for testing purposes
  const balance = formatCurrencyAmount(currencyBalance, 4)
  if (!chainId || !fiatValue || !isChainAllowed(connector, chainId)) return null
  const { label, logoUrl } = CHAIN_INFO[chainId]
  const multipleBalances = true // for testing purposes
  const totalBalance = 4.3

  return (
    <BalancesCard>
      {multipleBalances ? (
        <>
          <TotalBalanceSection>
            Your balance across all networks
            <TotalBalance>
              <TotalBalanceItem>{`${totalBalance} ${tokenSymbol}`}</TotalBalanceItem>{' '}
              <TotalBalanceItem>$4,210.12</TotalBalanceItem>
            </TotalBalance>
          </TotalBalanceSection>
          <NetworkBalancesSection>Your balances by network</NetworkBalancesSection>
        </>
      ) : (
        `Your balance on ${label}`
      )}

      <NetworkBalance
        logoUrl={logoUrl}
        balance={'1'}
        tokenSymbol={tokenSymbol ?? 'XXX'}
        fiatValue={fiatValue}
        label={label}
      />
      <NetworkBalance
        logoUrl={logoUrl}
        balance={'3.3'}
        tokenSymbol={tokenSymbol ?? 'XXX'}
        fiatValue={3200}
        label={'Polygon'}
      />
    </BalancesCard>
  )
}
