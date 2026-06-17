import { Flex, Text } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { CurrencyLogo } from '~/components/Logo/CurrencyLogo'
import { InterfaceTrade } from '~/state/routing/types'
export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const { formatCurrencyAmount } = useLocalizationContext()

  return (
    <Flex row centered gap="$gap8" width="100%">
      <CurrencyLogo currency={trade.inputAmount.currency} size={16} />
      <Text variant="body3" color="$neutral1">
        {formatCurrencyAmount({
          value: trade.inputAmount,
          type: NumberType.TokenTx,
        })}{' '}
        {trade.inputAmount.currency.symbol}
      </Text>
      <ArrowRight size="$icon.12" color="$neutral1" />
      <CurrencyLogo currency={trade.outputAmount.currency} size={16} />
      <Text variant="body3" color="$neutral1">
        {formatCurrencyAmount({
          value: trade.outputAmount,
          type: NumberType.TokenTx,
        })}{' '}
        {trade.outputAmount.currency.symbol}
      </Text>
    </Flex>
  )
}
