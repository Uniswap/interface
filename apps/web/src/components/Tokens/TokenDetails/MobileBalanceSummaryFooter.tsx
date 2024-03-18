import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { CHAIN_ID_TO_BACKEND_NAME } from 'graphql/data/util'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import styled from 'styled-components'
import { StyledInternalLink, ThemedText } from 'theme/components'
import { Z_INDEX } from 'theme/zIndex'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Wrapper = styled.div`
  align-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  display: none;
  flex-direction: row;
  font-weight: 535;
  font-size: 14px;
  height: fit-content;
  justify-content: space-between;
  left: 0;
  line-height: 20px;
  position: fixed;
  z-index: ${Z_INDEX.sticky};
  border-radius: 20px;
  bottom: 56px;
  margin: 8px;
  padding: 12px 32px;
  width: calc(100vw - 16px);

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.md}px) {
    bottom: 0px;
  }
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.lg}px) {
    display: flex;
  }
`
const BalanceValue = styled.div`
  color: ${({ theme }) => theme.neutral1};
  font-size: 20px;
  line-height: 20px;
  display: flex;
  gap: 8px;
`
const Balance = styled.div`
  align-items: flex-end;
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
  gap: 6px;
`
const FiatValue = styled(ThemedText.Caption)`
  font-size: 12px;
  line-height: 16px;

  @media screen and (min-width: ${({ theme }) => theme.breakpoint.sm}px) {
    line-height: 24px;
  }
`
const SwapButton = styled(StyledInternalLink)`
  background-color: ${({ theme }) => theme.accent1};
  border: none;
  border-radius: 22px;
  color: ${({ theme }) => theme.neutralContrast};
  display: flex;
  flex: 1 1 auto;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 535;
  height: 44px;
  justify-content: center;
  margin: auto;
  max-width: 100vw;
`

export default function MobileBalanceSummaryFooter() {
  const { currency, multiChainMap, currencyChain } = useTDPContext()
  const pageChainBalance = multiChainMap[currencyChain]?.balance

  const { account } = useWeb3React()
  const { formatNumber } = useFormatter()

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
    <Wrapper>
      {Boolean(account && pageChainBalance) && (
        <BalanceInfo>
          <Trans>Your balance</Trans>
          <Balance>
            <BalanceValue>
              {formattedGqlBalance} {currency.symbol}
            </BalanceValue>
            <FiatValue>{formattedUsdGqlValue}</FiatValue>
          </Balance>
        </BalanceInfo>
      )}
      <SwapButton to={`/swap?chain=${chain}&outputCurrency=${currency.isNative ? NATIVE_CHAIN_ID : currency.address}`}>
        <Trans>Swap</Trans>
      </SwapButton>
    </Wrapper>
  )
}
