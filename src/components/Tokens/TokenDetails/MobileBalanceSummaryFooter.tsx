import { Trans } from '@lingui/macro'
import { formatToDecimal } from 'analytics/utils'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { currencyAmountToPreciseFloat, formatDollar } from 'utils/formatDollarAmt'

import { BalanceSummaryProps } from './BalanceSummary'

const Wrapper = styled.div`
  align-content: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px 20px 0px 0px;
  bottom: 56px;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  flex-direction: column;
  font-weight: 500;
  font-size: 14px;
  height: fit-content;
  left: 0;
  line-height: 20px;
  padding: 12px 16px;
  position: fixed;
  width: 100%;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    bottom: 0px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: none;
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
  align-self: flex-end;
  display: flex;
  font-size: 12px;
  line-height: 16px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}) {
    line-height: 24px;
  }
`
const SwapButton = styled.button`
  align-items: center;
  background-color: ${({ theme }) => theme.accentAction};
  border: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  display: flex;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  height: 44px;
  justify-content: center;
  width: 120px;
`
const TotalBalancesSection = styled.div`
  align-items: center;
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  justify-content: space-between;
`

export default function MobileBalanceSummaryFooter({
  tokenAmount,
  nativeCurrencyAmount,
  isNative,
}: BalanceSummaryProps) {
  const balanceUsdValue = useStablecoinValue(tokenAmount)
  const nativeBalanceUsdValue = useStablecoinValue(nativeCurrencyAmount)

  const formattedBalance = tokenAmount
    ? formatToDecimal(tokenAmount, Math.min(tokenAmount.currency.decimals, 2))
    : undefined

  const balanceUsd = balanceUsdValue ? currencyAmountToPreciseFloat(balanceUsdValue) : undefined

  const formattedNativeBalance = nativeCurrencyAmount
    ? formatToDecimal(nativeCurrencyAmount, Math.min(nativeCurrencyAmount.currency.decimals, 2))
    : undefined
  const nativeBalanceUsd = nativeBalanceUsdValue ? currencyAmountToPreciseFloat(nativeBalanceUsdValue) : undefined

  if ((!tokenAmount && !nativeCurrencyAmount) || (nativeCurrencyAmount?.equalTo(0) && tokenAmount?.equalTo(0))) {
    return null
  }

  const outputTokenAddress = tokenAmount?.currency.address ?? nativeCurrencyAmount?.wrapped.currency.address

  return (
    <Wrapper>
      <TotalBalancesSection>
        {Boolean(formattedBalance !== undefined && !isNative) && (
          <BalanceInfo>
            <Trans>Your {tokenAmount?.currency?.symbol} balance</Trans>
            <BalanceTotal>
              <BalanceValue>
                {formattedBalance} {tokenAmount?.currency?.symbol}
              </BalanceValue>
              <FiatValue>{formatDollar(balanceUsd, true)}</FiatValue>
            </BalanceTotal>
          </BalanceInfo>
        )}
        {isNative && (
          <BalanceInfo>
            <Trans>Your {nativeCurrencyAmount?.currency?.symbol} balance</Trans>
            <BalanceTotal>
              <BalanceValue>
                {formattedNativeBalance} {nativeCurrencyAmount?.currency?.symbol}
              </BalanceValue>
              <FiatValue>{formatDollar(nativeBalanceUsd, true)}</FiatValue>
            </BalanceTotal>
          </BalanceInfo>
        )}
        <Link to={`/swap?outputCurrency=${outputTokenAddress}`}>
          <SwapButton>
            <Trans>Swap</Trans>
          </SwapButton>
        </Link>
      </TotalBalancesSection>
    </Wrapper>
  )
}
