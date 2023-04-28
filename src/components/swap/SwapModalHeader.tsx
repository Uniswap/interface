import { t, Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { AutoColumn } from 'components/Column'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { SwapModalHeaderAmount } from './SwapModalHeaderAmount'

const RuleWrapper = styled.div`
  margin: 12px 2px;
`

const HeaderContainer = styled(AutoColumn)`
  margin: 16px 0 0 0;
`

const Rule = styled.hr<{ padded?: true; scrollingEdge?: 'top' | 'bottom' }>`
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin: 0 ${({ padded }) => (padded ? '12px' : 0)};
  margin-bottom: ${({ scrollingEdge }) => (scrollingEdge === 'bottom' ? -1 : 0)}px;
  margin-top: ${({ scrollingEdge }) => (scrollingEdge !== 'bottom' ? -1 : 0)}px;

  max-width: auto;
  width: auto;
`

export default function SwapModalHeader({
  trade,
  allowedSlippage,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
}) {
  const fiatValueInput = useUSDPrice(trade.inputAmount)
  const fiatValueOutput = useUSDPrice(trade.outputAmount)

  const estimateMessage = useMemo(() => {
    return trade.tradeType === TradeType.EXACT_INPUT ? (
      <ThemedText.Caption textAlign="left" style={{ width: '100%' }}>
        <Trans>
          Output is estimated. You will receive at least{' '}
          <b>
            {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
          </b>{' '}
          or the transaction will revert.
        </Trans>
      </ThemedText.Caption>
    ) : (
      <ThemedText.Caption textAlign="left" style={{ width: '100%' }}>
        <Trans>
          Input is estimated. You will sell at most{' '}
          <b>
            {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
          </b>{' '}
          or the transaction will revert.
        </Trans>
      </ThemedText.Caption>
    )
  }, [allowedSlippage, trade])

  return (
    <HeaderContainer gap="sm">
      <SwapModalHeaderAmount
        field="input"
        label={t`You pay`}
        amount={trade.inputAmount}
        usdAmount={fiatValueInput.data}
      />
      <SwapModalHeaderAmount
        field="output"
        label={t`You receive`}
        amount={trade.outputAmount}
        usdAmount={fiatValueOutput.data}
        tooltipText={estimateMessage}
      />
      <RuleWrapper>
        <Rule />
      </RuleWrapper>
    </HeaderContainer>
  )
}
