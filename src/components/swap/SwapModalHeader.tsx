import { t, Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import Column, { AutoColumn } from 'components/Column'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { InterfaceTrade } from 'state/routing/types'
import { Field } from 'state/swap/actions'
import styled from 'styled-components/macro'
import { Divider, ThemedText } from 'theme'

import { SwapModalHeaderAmount } from './SwapModalHeaderAmount'

const Rule = styled(Divider)`
  margin: 16px 2px 24px 2px;
`

const HeaderContainer = styled(AutoColumn)`
  margin-top: 16px;
`

export default function SwapModalHeader({
  trade,
  allowedSlippage,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  allowedSlippage: Percent
}) {
  const fiatValueInput = useUSDPrice(trade?.inputAmount)
  const fiatValueOutput = useUSDPrice(trade?.outputAmount)

  return (
    <HeaderContainer gap="sm">
      <Column gap="lg">
        <SwapModalHeaderAmount
          field={Field.INPUT}
          label={t`You pay`}
          amount={trade?.inputAmount}
          usdAmount={fiatValueInput.data}
        />
        <SwapModalHeaderAmount
          field={Field.OUTPUT}
          label={<Trans>You receive</Trans>}
          amount={trade?.outputAmount}
          usdAmount={fiatValueOutput.data}
          tooltipText={
            trade?.tradeType === TradeType.EXACT_INPUT ? (
              <ThemedText.Caption textAlign="left" style={{ width: '100%' }}>
                <Trans>
                  Output is estimated. You will receive at least{' '}
                  <b>
                    {trade?.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
                  </b>{' '}
                  or the transaction will revert.
                </Trans>
              </ThemedText.Caption>
            ) : (
              <ThemedText.Caption textAlign="left" style={{ width: '100%' }}>
                <Trans>
                  Input is estimated. You will sell at most{' '}
                  <b>
                    {trade?.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade?.inputAmount.currency.symbol}
                  </b>{' '}
                  or the transaction will revert.
                </Trans>
              </ThemedText.Caption>
            )
          }
        />
      </Column>
      <Rule />
    </HeaderContainer>
  )
}
