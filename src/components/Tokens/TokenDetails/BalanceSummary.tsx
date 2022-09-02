import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { formatToDecimal } from 'components/AmplitudeAnalytics/utils'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
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
// const NetworkBalancesSection = styled.div`
//   height: fit-content;
// `
const TotalBalanceSection = styled.div`
  height: fit-content;
  // border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  // margin-bottom: 20px;
  // padding-bottom: 20px;
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
  networkBalances,
  totalBalance,
}: {
  address: string
  networkBalances: (JSX.Element | null)[] | null
  totalBalance: number
}) {
  const token = useToken(address)
  const { loading, error } = useNetworkTokenBalances({ address })

  const { account } = useWeb3React()
  const balance = useTokenBalance(account, token ?? undefined)
  const balanceNumber = balance ? formatToDecimal(balance, Math.min(balance.currency.decimals, 6)) : undefined
  const balanceUsd = useStablecoinValue(balance)?.toFixed(2)
  const balanceUsdNumber = balanceUsd ? parseFloat(balanceUsd) : undefined

  // const { label: connectedLabel, logoUrl: connectedLogoUrl } = getChainInfoOrDefault(connectedChainId)
  // const connectedFiatValue = 1
  // const multipleBalances = true // for testing purposes

  if (loading || (!error && !balanceNumber && !balanceUsdNumber)) return null
  return (
    <BalancesCard>
      {
        error ? (
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
                <TotalBalanceItem>{`${balanceNumber} ${token?.symbol}`}</TotalBalanceItem>
                <TotalBalanceItem>{`$${balanceUsdNumber}`}</TotalBalanceItem>
              </TotalBalance>
            </TotalBalanceSection>
          </>
        )
        //   multipleBalances ? (
        //   <>
        //     <TotalBalanceSection>
        //       Your balance across all networks
        //       <TotalBalance>
        //         <TotalBalanceItem>{`${totalBalance} ${token?.symbol}`}</TotalBalanceItem>
        //         <TotalBalanceItem>$4,210.12</TotalBalanceItem>
        //       </TotalBalance>
        //     </TotalBalanceSection>
        //     <NetworkBalancesSection>Your balances by network</NetworkBalancesSection>
        //     {data && networkBalances}
        //   </>
        // ) : (
        //   <>
        //     Your balance on {connectedLabel}
        //     <NetworkBalance
        //       logoUrl={connectedLogoUrl}
        //       balance={'1'}
        //       tokenSymbol={token?.symbol ?? 'XXX'}
        //       fiatValue={connectedFiatValue}
        //       label={connectedLabel}
        //       networkColor={theme.textPrimary}
        //     />
        //   </>
        //   )
      }
    </BalancesCard>
  )
}
