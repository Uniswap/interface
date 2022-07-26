import { useToken } from 'hooks/Tokens'
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
  justify-content: space-between;
  position: fixed;
  left: 0;
  bottom: 56px;
  display: flex;
`
const BalanceValue = styled.div`
  font-size: 20px;
  line-height: 28px;
  display: flex;
  gap: 8px;
`
const BalanceTotal = styled.div`
  display: flex;
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
`

export default function FooterBalanceSummary({ address }: { address: string }) {
  const tokenSymbol = useToken(address)?.symbol
  const multipleBalances = true
  return (
    <>
      <BalanceFooter>
        <BalanceInfo>
          Your balance
          <BalanceTotal>
            <BalanceValue>33.02 {tokenSymbol}</BalanceValue>
            <FiatValue>($107, 610.04)</FiatValue>
            {multipleBalances ?? <ViewAll>View all balances</ViewAll>}
          </BalanceTotal>
        </BalanceInfo>
        <SwapButton onClick={() => (window.location.href = 'https://app.uniswap.org/#/swap')}>Swap</SwapButton>
      </BalanceFooter>
      <FakeFooterNavBar>**leaving space for updated nav footer**</FakeFooterNavBar>
    </>
  )
}
