import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useInfoTDPEnabled } from 'featureFlags/flags/infoTDP'
import { PortfolioTokenBalancePartsFragment } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled, { css } from 'styled-components'
import { StyledInternalLink, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Wrapper = styled.div<{ isInfoTDPEnabled?: boolean }>`
  align-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  display: flex;
  flex-direction: row;
  font-weight: 535;
  font-size: 14px;
  height: fit-content;
  justify-content: space-between;
  left: 0;
  line-height: 20px;
  position: fixed;

  ${({ isInfoTDPEnabled }) =>
    isInfoTDPEnabled
      ? css`
          border-radius: 20px;
          bottom: 56px;
          margin: 8px;
          padding: 12px 32px;
          width: calc(100vw - 16px);
        `
      : css`
          border-bottom: none;
          border-radius: 20px 20px 0px 0px;
          bottom: 52px;
          padding: 12px 16px;
          width: 100%;
        `}

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    bottom: 0px;
  }
  @media screen and (min-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: none;
  }
`
const BalanceValue = styled.div<{ isInfoTDPEnabled?: boolean }>`
  color: ${({ theme }) => theme.neutral1};
  font-size: 20px;
  line-height: ${({ isInfoTDPEnabled }) => (isInfoTDPEnabled ? '20px' : '28px')};
  display: flex;
  gap: 8px;
`
const Balance = styled.div<{ isInfoTDPEnabled?: boolean }>`
  align-items: ${({ isInfoTDPEnabled }) => (isInfoTDPEnabled ? 'flex-end' : 'center')};
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`
const BalanceInfo = styled.div<{ isInfoTDPEnabled?: boolean }>`
  display: flex;
  flex: 10 1 auto;
  flex-direction: column;
  justify-content: flex-start;
  ${({ isInfoTDPEnabled }) => isInfoTDPEnabled && 'gap: 6px;'}
`
const FiatValue = styled(ThemedText.Caption)<{ isInfoTDPEnabled?: boolean }>`
  ${({ isInfoTDPEnabled, theme }) => !isInfoTDPEnabled && `color: ${theme.neutral2};`}
  font-size: 12px;
  line-height: 16px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    line-height: 24px;
  }
`
const SwapButton = styled(StyledInternalLink)<{ isInfoTDPEnabled?: boolean }>`
  background-color: ${({ theme }) => theme.accent1};
  border: none;
  border-radius: ${({ isInfoTDPEnabled }) => (isInfoTDPEnabled ? '22px' : '12px')};
  color: ${({ theme }) => theme.deprecated_accentTextLightPrimary};
  display: flex;
  flex: 1 1 auto;
  padding: 12px 16px;
  font-size: ${({ isInfoTDPEnabled }) => (isInfoTDPEnabled ? '16px' : '1em')};
  font-weight: 535;
  height: 44px;
  justify-content: center;
  margin: auto;
  max-width: 100vw;
`

export default function MobileBalanceSummaryFooter({
  currency,
  pageChainBalance,
}: {
  currency: Currency
  pageChainBalance?: PortfolioTokenBalancePartsFragment
}) {
  const isInfoTDPEnabled = useInfoTDPEnabled()

  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account, currency)
  const { formatCurrencyAmount, formatNumber } = useFormatter()
  const formattedBalance = formatCurrencyAmount({
    amount: balance,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = formatCurrencyAmount({
    amount: useStablecoinValue(balance),
    type: NumberType.FiatTokenStats,
  })
  const formattedGqlBalance = formatNumber({
    input: pageChainBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdGqlValue = formatNumber({
    input: pageChainBalance?.denominatedValue?.value,
    type: NumberType.PortfolioBalance,
  })
  const chain = CHAIN_ID_TO_BACKEND_NAME[currency.chainId].toLowerCase()

  return (
    <Wrapper isInfoTDPEnabled={isInfoTDPEnabled}>
      {Boolean(account && (isInfoTDPEnabled ? pageChainBalance : balance)) && (
        <BalanceInfo isInfoTDPEnabled={isInfoTDPEnabled}>
          {isInfoTDPEnabled ? <Trans>Your balance</Trans> : <Trans>Your {currency.symbol} balance</Trans>}
          <Balance isInfoTDPEnabled={isInfoTDPEnabled}>
            <BalanceValue isInfoTDPEnabled={isInfoTDPEnabled}>
              {isInfoTDPEnabled ? formattedGqlBalance : formattedBalance} {currency.symbol}
            </BalanceValue>
            <FiatValue isInfoTDPEnabled={isInfoTDPEnabled}>
              {isInfoTDPEnabled ? `(${formattedUsdGqlValue})` : formattedUsdValue}
            </FiatValue>
          </Balance>
        </BalanceInfo>
      )}
      <SwapButton
        isInfoTDPEnabled={isInfoTDPEnabled}
        to={`/swap?chain=${chain}&outputCurrency=${currency.isNative ? NATIVE_CHAIN_ID : currency.address}`}
      >
        <Trans>Swap</Trans>
      </SwapButton>
    </Wrapper>
  )
}
