import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { CurrencyField } from 'uniswap/src/types/currency'
import { AmountHeader } from '~/components/AmountHeader'
import { InterfaceTrade } from '~/state/routing/types'
import { isPreviewTrade } from '~/state/routing/utils'

export function SwapPreview({
  trade,
  inputCurrency,
  allowedSlippage,
}: {
  trade: InterfaceTrade
  inputCurrency?: Currency
  allowedSlippage: Percent
}) {
  const { t } = useTranslation()
  const fiatValueInput = useUSDCValue(trade.inputAmount)
  const fiatValueOutput = useUSDCValue(trade.outputAmount)

  return (
    <Flex gap="$gap8">
      <Flex gap="$gap24">
        <AmountHeader
          field={CurrencyField.INPUT}
          label={t('common.sell.label')}
          amount={trade.inputAmount}
          currency={inputCurrency ?? trade.inputAmount.currency}
          usdAmount={fiatValueInput?.toExact()}
          isLoading={isPreviewTrade(trade) && trade.tradeType === TradeType.EXACT_OUTPUT}
        />
        <AmountHeader
          field={CurrencyField.OUTPUT}
          label={t('common.buy.label')}
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
    </Flex>
  )
}
