import styled from 'styled-components/macro'

const BalanceItem = styled.div`
  display: flex;
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

export default function NetworkBalance({
  logoUrl,
  balance,
  tokenSymbol,
  fiatValue,
  label,
}: {
  logoUrl: string
  balance: string
  tokenSymbol: string
  fiatValue: number
  label: string
}) {
  return (
    <SingleNetworkBalanceContainer>
      <Logo src={logoUrl} />
      <SingleNetworkBalance>
        <BalanceRow>
          <BalanceItem>{`${balance} ${tokenSymbol}`}</BalanceItem>
          <BalanceItem>${fiatValue}</BalanceItem>
        </BalanceRow>
        <Network>{label}</Network>
      </SingleNetworkBalance>
    </SingleNetworkBalanceContainer>
  )
}
