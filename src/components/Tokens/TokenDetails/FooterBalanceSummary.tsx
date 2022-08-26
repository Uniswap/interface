import { Trans } from '@lingui/macro'
import { useToken } from 'hooks/Tokens'
import { useNetworkTokenBalances } from 'hooks/useNetworkTokenBalances'
import { useState } from 'react'
import { AlertTriangle } from 'react-feather'
import styled from 'styled-components/macro'

import { SMALLEST_MOBILE_MEDIA_BREAKPOINT } from '../constants'
import { LoadingBubble } from '../loading'

const PLACEHOLDER_NAV_FOOTER_HEIGHT = '56px'
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
  bottom: ${PLACEHOLDER_NAV_FOOTER_HEIGHT};
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
const BalanceInfo = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
`
const FakeFooterNavBar = styled.div`
  position: fixed;
  bottom: 0px;
  left: 0px;
  background-color: ${({ theme }) => theme.backgroundBackdrop};
  height: ${PLACEHOLDER_NAV_FOOTER_HEIGHT};
  width: 100%;
  align-items: flex-end;
  padding: 20px 8px;
  font-size: 10px;
`
const FiatValue = styled.span`
  display: flex;
  align-self: flex-end;
  font-size: 12px;
  line-height: 24px;

  @media only screen and (max-width: ${SMALLEST_MOBILE_MEDIA_BREAKPOINT}) {
    line-height: 16px;
  }
`
const NetworkBalancesSection = styled.div`
  height: fit-content;
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  display: flex;
  flex-direction: column;
  padding: 16px 0px 8px 0px;
  margin-top: 16px;
  color: ${({ theme }) => theme.textPrimary};
`
const NetworkBalancesLabel = styled.span`
  color: ${({ theme }) => theme.textSecondary};
`
const SwapButton = styled.button`
  background-color: ${({ theme }) => theme.accentAction};
  border-radius: 12px;
  display: flex;
  align-items: center;
  border: none;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  padding: 12px 16px;
  width: 120px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  justify-content: center;
`
const TotalBalancesSection = styled.div`
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  justify-content: space-between;
  align-items: center;
`
const ViewAll = styled.span`
  display: flex;
  color: ${({ theme }) => theme.accentAction};
  font-size: 14px;
  line-height: 20px;
  cursor: pointer;
`
const ErrorState = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 8px;
`
const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`
const TopBalanceLoadBubble = styled(LoadingBubble)`
  height: 12px;
  width: 172px;
`
const BottomBalanceLoadBubble = styled(LoadingBubble)`
  height: 16px;
  width: 188px;
`
const ErrorText = styled.span`
  display: flex;
  flex-wrap: wrap;
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
  const multipleBalances = false // for testing purposes
  const networkNameIfOneBalance = 'Ethereum' // for testing purposes
  const { loading, error } = useNetworkTokenBalances({ address })
  return (
    <BalanceFooter>
      <TotalBalancesSection>
        {loading ? (
          <LoadingState>
            <TopBalanceLoadBubble></TopBalanceLoadBubble>
            <BottomBalanceLoadBubble></BottomBalanceLoadBubble>
          </LoadingState>
        ) : error ? (
          <ErrorState>
            <AlertTriangle size={17} />
            <ErrorText>
              <Trans>There was an error fetching your balance</Trans>
            </ErrorText>
          </ErrorState>
        ) : (
          <BalanceInfo>
            {multipleBalances ? 'Balance on all networks' : `Your balance on ${networkNameIfOneBalance}`}
            <BalanceTotal>
              <BalanceValue>
                {totalBalance} {tokenSymbol}
              </BalanceValue>
              <FiatValue>($107, 610.04)</FiatValue>
            </BalanceTotal>
            {multipleBalances && (
              <ViewAll onClick={() => setShowMultipleBalances(!showMultipleBalances)}>
                <Trans>{showMultipleBalances ? 'Hide' : 'View'} all balances</Trans>
              </ViewAll>
            )}
          </BalanceInfo>
        )}
        <SwapButton onClick={() => (window.location.href = 'https://app.uniswap.org/#/swap')}>
          <Trans>Swap</Trans>
        </SwapButton>
      </TotalBalancesSection>
      {showMultipleBalances && (
        <NetworkBalancesSection>
          <NetworkBalancesLabel>
            <Trans>Your balances by network</Trans>
          </NetworkBalancesLabel>
          {networkBalances}
        </NetworkBalancesSection>
      )}
      <FakeFooterNavBar>**leaving space for updated nav footer**</FakeFooterNavBar>
    </BalanceFooter>
  )
}
