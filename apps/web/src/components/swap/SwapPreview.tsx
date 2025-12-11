import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import Column, { AutoColumn } from 'components/deprecated/Column'
import { SwapModalHeaderAmount } from 'components/swap/SwapModalHeaderAmount'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { deprecatedStyled } from 'lib/styled-components'
import { Trans } from 'react-i18next'
import { InterfaceTrade } from 'state/routing/types'
import { isPreviewTrade } from 'state/routing/utils'
import { ThemedText } from 'theme/components'
import { CurrencyField } from 'uniswap/src/types/currency'

const HeaderContainer = deprecatedStyled(AutoColumn)`
  margin-top: 0px;
`

export function SwapPreview({
  trade,
  inputCurrency,
  allowedSlippage,
}: {
  trade: InterfaceTrade
  inputCurrency?: Currency
  allowedSlippage: Percent
}) {
  const fiatValueInput = useUSDPrice(trade.inputAmount)
  const fiatValueOutput = useUSDPrice(trade.outputAmount)

  return (
    <HeaderContainer gap="sm">
      <Column gap="lg">
        <SwapModalHeaderAmount
          field={CurrencyField.INPUT}
          label={<Trans i18nKey="common.sell.label" />}
          amount={trade.inputAmount}
          currency={inputCurrency ?? trade.inputAmount.currency}
          usdAmount={fiatValueInput.data}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_OUTPUT}
        />
        <SwapModalHeaderAmount
          field={CurrencyField.OUTPUT}
          label={<Trans i18nKey="common.buy.label" />}
          amount={trade.outputAmount}
          currency={trade.outputAmount.currency}
          usdAmount={fiatValueOutput.data}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_INPUT}
          tooltipText={
            trade.tradeType === TradeType.EXACT_INPUT ? (
              <ThemedText.Caption>
                <Trans
                  i18nKey="swap.outputEstimated.atLeast"
                  components={{
                    amount: (
                      <b>
                        {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
                      </b>
                    ),
                  }}
                />
              </ThemedText.Caption>
            ) : (
              <ThemedText.Caption>
                <Trans
                  i18nKey="swap.inputEstimated.atMost"
                  components={{
                    amount: (
                      <b>
                        {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
                      </b>
                    ),
                  }}
                />
              </ThemedText.Caption>
            )
          }
        />
      </Column>
    </HeaderContainer>
  )
}
