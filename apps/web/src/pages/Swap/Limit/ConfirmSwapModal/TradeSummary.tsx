import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import Row from '~/components/deprecated/Row'
import CurrencyLogo from '~/components/Logo/CurrencyLogo'
import { InterfaceTrade } from '~/state/routing/types'
import { ThemedText } from '~/theme/components'

export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const { formatCurrencyAmount } = useLocalizationContext()

  return (
    <Row gap="sm" justify="center" align="center">
      <CurrencyLogo currency={trade.inputAmount.currency} size={16} />
      <ThemedText.LabelSmall color="neutral1">
        {formatCurrencyAmount({
          value: trade.inputAmount,
          type: NumberType.TokenTx,
        })}{' '}
        {trade.inputAmount.currency.symbol}
      </ThemedText.LabelSmall>
      <ArrowRight size="$icon.12" color="$neutral1" />
      <CurrencyLogo currency={trade.outputAmount.currency} size={16} />
      <ThemedText.LabelSmall color="neutral1">
        {formatCurrencyAmount({
          value: trade.outputAmount,
          type: NumberType.TokenTx,
        })}{' '}
        {trade.outputAmount.currency.symbol}
      </ThemedText.LabelSmall>
    </Row>
  )
}
