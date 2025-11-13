import Row from 'components/deprecated/Row'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { ArrowRight } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { ThemedText } from 'theme/components'
import { useSporeColors } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const colors = useSporeColors()
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
      <ArrowRight color={colors.neutral1.val} size="12px" />
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
