import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useState } from 'react'
import styled from 'styled-components/macro'

const BalanceFooter = styled.div`
  height: fit-content;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px 20px 0px 0px;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  width: 100%;
  color: ${({ theme }) => theme.textSecondary};
  position: fixed;
  left: 0;
  bottom: 56px;
  display: flex;
  flex-direction: column;
  align-content: center;
`
const BalanceValue = styled.div`
  font-size: 20px;
  line-height: 28px;
  display: flex;
  gap: 8px;
`
const BalanceTotal = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: ${({ theme }) => theme.textPrimary};
`
const FiatValue = styled.span`
  display: flex;
  align-self: flex-end;
  font-size: 12px;
  line-height: 24px;
`
const BalanceInfo = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
`
const SwapButton = styled.button`
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 12px;
  display: flex;
  align-items: center;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  padding: 12px 16px;
  width: 120px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  justify-content: center;
  cursor: pointer;
`
const FakeFooterNavBar = styled.div`
  position: fixed;
  bottom: 0px;
  left: 0px;
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  height: 56px;
  width: 100%;
  align-items: flex-end;
  padding: 20px 10px;
  font-size: 10px;
`
const ViewAll = styled.span`
  display: flex;
  color: ${({ theme }) => theme.accentAction};
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
`
const NetworkBalancesSection = styled.div`
  height: fit-content;
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  display: flex;
  flex-direction: column;
  padding: 16px 0px;
  margin-top: 16px;
  color: ${({ theme }) => theme.textPrimary};
`
const TotalBalancesSection = styled.div`
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  justify-content: space-between;
  align-items: center;
`
const NetworkBalancesLabel = styled.span`
  color: ${({ theme }) => theme.textSecondary};
`

export default function FooterBalanceSummary({
  address,
  networkBalances,
  totalBalance,
}: {
  address: string
  networkBalances: (JSX.Element | null)[] | null
  totalBalance: number
}) {
  const tokenSymbol = useToken(address)?.symbol
  const [showMultipleBalances, setShowMultipleBalances] = useState(false)
  const multipleBalances = true
  const { loading, error } = useNetworkTokenBalances({ address })
  return (
    <BalanceFooter>
      {loading ? (
        <span>loading...</span>
      ) : error ? (
        <span>Error fetching user balances</span>
      ) : (
        <>
          <TotalBalancesSection>
            <BalanceInfo>
              Your balance
              <BalanceTotal>
                <BalanceValue>
                  {totalBalance} {tokenSymbol}
                </BalanceValue>
                <FiatValue>($107, 610.04)</FiatValue>
              </BalanceTotal>
              {multipleBalances && (
                <ViewAll onClick={() => setShowMultipleBalances(!showMultipleBalances)}>
                  {showMultipleBalances ? 'Hide' : 'View'} all balances
                </ViewAll>
              )}
            </BalanceInfo>
            <SwapButton onClick={() => (window.location.href = 'https://app.uniswap.org/#/swap')}>Swap</SwapButton>
          </TotalBalancesSection>
          {showMultipleBalances && (
            <NetworkBalancesSection>
              <NetworkBalancesLabel>Your balances by network</NetworkBalancesLabel> {networkBalances}
            </NetworkBalancesSection>
          )}
        </>
      )}

      <FakeFooterNavBar>**leaving space for updated nav footer**</FakeFooterNavBar>
    </BalanceFooter>
  )
}
