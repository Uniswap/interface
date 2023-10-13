import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import Column, { AutoColumn } from 'components/Column'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { InterfaceTrade } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { Field } from 'state/swap/actions'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { SwapModalHeaderAmount } from './SwapModalHeaderAmount'

const HeaderContainer = styled(AutoColumn)`
  margin-top: 16px;
`

export default function SwapModalHeader({
  trade,
  inputCurrency,
  allowedSlippage,
}: {
  trade: InterfaceTrade
  inputCurrency?: Currency
  allowedSlippage: Percent
}) {
  const fiatValueInput = useUSDPrice(trade.inputAmount)
  const fiatValueOutput = useUSDPrice(trade.postTaxOutputAmount)

  return (
    <HeaderContainer gap="sm">
      <Column gap="lg">
        <SwapModalHeaderAmount
          field={Field.INPUT}
          label={<Trans>You pay</Trans>}
          amount={trade.inputAmount}
          currency={inputCurrency ?? trade.inputAmount.currency}
          usdAmount={fiatValueInput.data}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_OUTPUT}
        />
        <SwapModalHeaderAmount
          field={Field.OUTPUT}
          label={<Trans>You receive</Trans>}
          amount={trade.postTaxOutputAmount}
          currency={trade.outputAmount.currency}
          usdAmount={fiatValueOutput.data}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_INPUT}
          tooltipText={
            trade.tradeType === TradeType.EXACT_INPUT ? (
              <ThemedText.Caption>
                <Trans>
                  Output is estimated. You will receive at least{' '}
                  <b>
                    {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
                  </b>{' '}
                  or the transaction will revert.
                </Trans>
              </ThemedText.Caption>
            ) : (
              <ThemedText.Caption>
                <Trans>
                  Input is estimated. You will sell at most{' '}
                  <b>
                    {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
                  </b>{' '}
                  or the transaction will revert.
                </Trans>
              </ThemedText.Caption>
            )
          }
        />
      </Column>
    </HeaderContainer>
  )
}
