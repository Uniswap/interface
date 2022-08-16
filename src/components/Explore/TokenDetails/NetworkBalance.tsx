import styled, { useTheme } from 'styled-components/macro'

const Balance = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  line-height: 20px;
`
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
const Network = styled.span<{ color: string }>`
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: ${({ color }) => color};
`
const NetworkBalanceContainer = styled.div`
  display: flex;
  padding-top: 16px;
  align-items: center;
`

export default function NetworkBalance({
  logoUrl,
  balance,
  tokenSymbol,
  fiatValue,
  label,
  networkColor,
}: {
  logoUrl: string
  balance: string
  tokenSymbol: string
  fiatValue: string | number
  label: string
  networkColor: string | undefined
}) {
  const theme = useTheme()
  return (
    <NetworkBalanceContainer>
      <Logo src={logoUrl} />
      <Balance>
        <BalanceRow>
          <BalanceItem>
            {balance}&nbsp;{tokenSymbol}
          </BalanceItem>
          <BalanceItem>${fiatValue}</BalanceItem>
        </BalanceRow>
        <Network color={networkColor ?? theme.textPrimary}>{label}</Network>
      </Balance>
    </NetworkBalanceContainer>
  )
}
