import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { CurrencyField } from 'uniswap/src/types/currency'
import { AutoColumn } from '~/components/deprecated/Column'
import { SwapModalHeaderAmount } from '~/components/swap/SwapModalHeaderAmount'
import { deprecatedStyled } from '~/lib/deprecated-styled'
import { InterfaceTrade } from '~/state/routing/types'
import { isPreviewTrade } from '~/state/routing/utils'

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
  const fiatValueInput = useUSDCValue(trade.inputAmount)
  const fiatValueOutput = useUSDCValue(trade.outputAmount)

  return (
    <HeaderContainer gap="sm">
      <Flex gap="$gap24">
        <SwapModalHeaderAmount
          field={CurrencyField.INPUT}
          label={<Trans i18nKey="common.sell.label" />}
          amount={trade.inputAmount}
          currency={inputCurrency ?? trade.inputAmount.currency}
          usdAmount={fiatValueInput?.toExact()}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_OUTPUT}
        />
        <SwapModalHeaderAmount
          field={CurrencyField.OUTPUT}
          label={<Trans i18nKey="common.buy.label" />}
          amount={trade.outputAmount}
          currency={trade.outputAmount.currency}
          usdAmount={fiatValueOutput?.toExact()}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_INPUT}
          tooltipText={
            trade.tradeType === TradeType.EXACT_INPUT ? (
              <Text variant="body4">
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
              </Text>
            ) : (
              <Text variant="body4">
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
              </Text>
            )
          }
        />
      </Flex>
    </HeaderContainer>
  )
}
