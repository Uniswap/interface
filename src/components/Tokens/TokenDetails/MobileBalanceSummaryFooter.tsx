import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled from 'styled-components'
import { StyledInternalLink } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Wrapper = styled.div`
  align-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.surface3};
  border-bottom: none;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 20px 20px 0px 0px;
  bottom: 52px;
  color: ${({ theme }) => theme.neutral2};
  display: flex;
  flex-direction: row;
  font-weight: 535;
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
  color: ${({ theme }) => theme.neutral1};
  font-size: 20px;
  line-height: 28px;
  display: flex;
  gap: 8px;
`
const Balance = styled.div`
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
  background-color: ${({ theme }) => theme.accent1};
  border: none;
  border-radius: 12px;
  color: ${({ theme }) => theme.deprecated_accentTextLightPrimary};
  display: flex;
  flex: 1 1 auto;
  padding: 12px 16px;
  font-size: 1em;
  font-weight: 535;
  height: 44px;
  justify-content: center;
  margin: auto;
  max-width: 100vw;
`

export default function MobileBalanceSummaryFooter({ token }: { token: Currency }) {
  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account, token)
  const { formatCurrencyAmount } = useFormatter()
  const formattedBalance = formatCurrencyAmount({
    amount: balance,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = formatCurrencyAmount({
    amount: useStablecoinValue(balance),
    type: NumberType.FiatTokenStats,
  })
  const chain = CHAIN_ID_TO_BACKEND_NAME[token.chainId].toLowerCase()

  return (
    <Wrapper>
      {Boolean(account && balance) && (
        <BalanceInfo>
          <Trans>Your {token.symbol} balance</Trans>
          <Balance>
            <BalanceValue>
              {formattedBalance} {token.symbol}
            </BalanceValue>
            <FiatValue>{formattedUsdValue}</FiatValue>
          </Balance>
        </BalanceInfo>
      )}
      <SwapButton to={`/swap?chainName=${chain}&outputCurrency=${token.isNative ? NATIVE_CHAIN_ID : token.address}`}>
        <Trans>Swap</Trans>
      </SwapButton>
    </Wrapper>
  )
}
