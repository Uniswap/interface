import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useToken } from 'hooks/Tokens'
import { useMultiNetworkAddressBalances } from 'hooks/useMultiNetworkAddressBalances'
import { AlertTriangle } from 'react-feather'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

import { LARGE_MEDIA_BREAKPOINT, SMALLEST_MOBILE_MEDIA_BREAKPOINT } from '../constants'
import { LoadingBubble } from '../loading'

const Wrapper = styled.div`
  height: fit-content;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px 20px 0px 0px;
  display: none !important;
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

  @media only screen and (max-width: ${LARGE_MEDIA_BREAKPOINT}) {
    display: flex !important;
  }
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
const FiatValue = styled.span`
  display: flex;
  align-self: flex-end;
  font-size: 12px;
  line-height: 24px;

  @media only screen and (max-width: ${SMALLEST_MOBILE_MEDIA_BREAKPOINT}) {
    line-height: 16px;
  }
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

interface BalanceSummaryProps {
  address: string
  symbol: string
  balance?: number
  balanceUsd?: number
}

export default function BalanceSummary({ address, symbol, balance, balanceUsd }: BalanceSummaryProps) {
  const { account, chainId: connectedChainId } = useWeb3React()

  const tokenSymbol = useToken(address)?.symbol
  const { data, error, loading } = useMultiNetworkAddressBalances({ ownerAddress: account, tokenAddress: address })
  console.log(data)
  console.log(`
  useMultiNetworkAddressBalances data: 👆
  =====
  error: ${error}
  =====
  loading: ${loading}
  ***
  `)
  return (
    <Wrapper>
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
          balance && (
            <BalanceInfo>
              <Trans>Your {symbol} balance</Trans>
              <BalanceTotal>
                <BalanceValue>
                  {balance} {tokenSymbol}
                </BalanceValue>
                {balanceUsd && <FiatValue>${balanceUsd}</FiatValue>}
              </BalanceTotal>
            </BalanceInfo>
          )
        )}
        <Link to={`/swap?outputCurrency=${address}`}>
          <SwapButton>
            <Trans>Swap</Trans>
          </SwapButton>
        </Link>
      </TotalBalancesSection>
    </Wrapper>
  )
}
