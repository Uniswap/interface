import { Trans } from '@lingui/macro'
import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useDummyGateEnabled } from 'featureFlags/flags/dummyFeatureGate'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'
import styled from 'styled-components/macro'
import { StyledInternalLink } from 'theme'

const Wrapper = styled.div`
  align-content: center;
  align-items: center;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  border-bottom: none;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 20px 20px 0px 0px;
  bottom: 52px;
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

export default function MobileBalanceSummaryFooter({ token }: { token: Currency }) {
  const { account } = useWeb3React()
  const balance = useCurrencyBalance(account, token)
  const formattedBalance = formatCurrencyAmount(balance, NumberType.TokenNonTx)
  const formattedUsdValue = formatCurrencyAmount(useStablecoinValue(balance), NumberType.FiatTokenStats)
  const chain = CHAIN_ID_TO_BACKEND_NAME[token.chainId].toLowerCase()
  const isDummyGateFlagEnabled = useDummyGateEnabled()

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
        <Trans>{isDummyGateFlagEnabled ? 'Go to Swap' : 'Swap'}</Trans>
      </SwapButton>
    </Wrapper>
  )
}
