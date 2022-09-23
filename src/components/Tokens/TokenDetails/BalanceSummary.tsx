import { Trans } from '@lingui/macro'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

const BalancesCard = styled.div`
  width: 100%;
  height: fit-content;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 12px;
  line-height: 16px;
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shallowShadow};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border: ${({ theme }) => `1px solid ${theme.backgroundOutline}`};
  border-radius: 16px;
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

const TotalBalanceSection = styled.div`
  height: fit-content;
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

export default function BalanceSummary({
  address,
  balance,
  balanceUsd,
}: {
  address: string
  balance?: number
  balanceUsd?: number
}) {
  const token = useToken(address)
  const { loading, error } = useNetworkTokenBalances({ address })

  if (loading || (!error && !balance && !balanceUsd)) return null
  return (
    <BalancesCard>
      {error ? (
        <ErrorState>
          <AlertTriangle size={24} />
          <ErrorText>
            <Trans>There was an error loading your {token?.symbol} balance</Trans>
          </ErrorText>
        </ErrorState>
      ) : (
        <>
          <TotalBalanceSection>
            Your balance
            <TotalBalance>
              <TotalBalanceItem>{`${balance} ${token?.symbol}`}</TotalBalanceItem>
              <TotalBalanceItem>{`$${balanceUsd}`}</TotalBalanceItem>
            </TotalBalance>
          </TotalBalanceSection>
        </>
      )}
    </BalancesCard>
  )
}
