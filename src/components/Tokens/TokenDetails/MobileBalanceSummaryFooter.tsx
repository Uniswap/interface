import { Trans } from '@lingui/macro'
import { formatToDecimal } from 'analytics/utils'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'
import { formatDollarAmount } from 'utils/formatDollarAmt'

import { SMALLEST_MOBILE_MEDIA_BREAKPOINT } from '../constants'
import { BalanceSummaryProps } from './BalanceSummary'

const Wrapper = styled.div`
  height: fit-content;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px 20px 0px 0px;
  display: flex;
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

  // 768 hardcoded to match NFT-redesign navbar breakpoints
  // src/nft/css/sprinkles.css.ts
  // change to match theme breakpoints when this navbar is updated
  @media screen and (min-width: 768px) {
    display: none !important;
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

export default function MobileBalanceSummaryFooter({
  tokenAmount,
  nativeCurrencyAmount,
  isNative,
}: BalanceSummaryProps) {
  const balanceUsdValue = useStablecoinValue(tokenAmount)?.toFixed(2)
  const nativeBalanceUsdValue = useStablecoinValue(nativeCurrencyAmount)?.toFixed(2)

  const formattedBalance = tokenAmount
    ? formatToDecimal(tokenAmount, Math.min(tokenAmount.currency.decimals, 2))
    : undefined

  const balanceUsd = balanceUsdValue ? parseFloat(balanceUsdValue) : undefined

  const formattedNativeBalance = nativeCurrencyAmount
    ? formatToDecimal(nativeCurrencyAmount, Math.min(nativeCurrencyAmount.currency.decimals, 2))
    : undefined
  const nativeBalanceUsd = nativeBalanceUsdValue ? parseFloat(nativeBalanceUsdValue) : undefined

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
              <FiatValue>{formatDollarAmount(balanceUsd)}</FiatValue>
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
              <FiatValue>{formatDollarAmount(nativeBalanceUsd)}</FiatValue>
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
