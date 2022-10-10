import { Trans } from '@lingui/macro'
import { formatToDecimal } from 'analytics/utils'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import styled from 'styled-components/macro'
import { StyledInternalLink } from 'theme'
import { currencyAmountToPreciseFloat, formatDollar } from 'utils/formatNumbers'

import { BalanceSummaryProps } from './BalanceSummary'

const Wrapper = styled.div`
  align-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px 20px 0px 0px;
  bottom: 56px;
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  flex-direction: row;
  font-weight: 500;
  font-size: 14px;
  height: fit-content;
  justify-content: space-between;
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
  color: ${({ theme }) => theme.textPrimary};
  font-size: 20px;
  line-height: 28px;
  display: flex;
  gap: 8px;
`
const BalanceTotal = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`
const BalanceInfo = styled.div`
  display: flex;
  flex: 10 1 auto;
  flex-direction: column;
  justify-content: flex-start;
`
const FiatValue = styled.span`
  font-size: 12px;
  line-height: 16px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    line-height: 24px;
  }
`
const SwapButton = styled(StyledInternalLink)`
  background-color: ${({ theme }) => theme.accentAction};
  border: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.accentTextLightPrimary};
  display: flex;
  flex: 1 1 auto;
  padding: 12px 16px;
  font-size: 1em;
  font-weight: 600;
  height: 44px;
  justify-content: center;
  margin: auto;
  max-width: 100vw;
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

  const outputTokenAddress = tokenAmount?.currency.address ?? nativeCurrencyAmount?.wrapped.currency.address

  return (
    <Wrapper>
      {Boolean(formattedBalance !== undefined && !isNative && tokenAmount?.greaterThan(0)) && (
        <BalanceInfo>
          <Trans>Your {tokenAmount?.currency?.symbol} balance</Trans>
          <BalanceTotal>
            <BalanceValue>
              {formattedBalance} {tokenAmount?.currency?.symbol}
            </BalanceValue>
            <FiatValue>{formatDollar({ num: balanceUsd, isPrice: true })}</FiatValue>
          </BalanceTotal>
        </BalanceInfo>
      )}
      {Boolean(isNative && nativeCurrencyAmount?.greaterThan(0)) && (
        <BalanceInfo>
          <Trans>Your {nativeCurrencyAmount?.currency?.symbol} balance</Trans>
          <BalanceTotal>
            <BalanceValue>
              {formattedNativeBalance} {nativeCurrencyAmount?.currency?.symbol}
            </BalanceValue>
            <FiatValue>{formatDollar({ num: nativeBalanceUsd, isPrice: true })}</FiatValue>
          </BalanceTotal>
        </BalanceInfo>
      )}
      <SwapButton to={`/swap?outputCurrency=${outputTokenAddress}`}>
        <Trans>Swap</Trans>
      </SwapButton>
    </Wrapper>
  )
}
