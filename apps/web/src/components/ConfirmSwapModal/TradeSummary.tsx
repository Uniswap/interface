import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/deprecated/Row'
import { useTheme } from 'lib/styled-components'
import { ArrowRight } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const theme = useTheme()
  const { formatReviewSwapCurrencyAmount } = useFormatter()

  return (
    <Row gap="sm" justify="center" align="center">
      <CurrencyLogo currency={trade.inputAmount.currency} size={16} />
      <ThemedText.LabelSmall color="neutral1">
        {formatReviewSwapCurrencyAmount(trade.inputAmount)} {trade.inputAmount.currency.symbol}
      </ThemedText.LabelSmall>
      <ArrowRight color={theme.neutral1} size="12px" />
      <CurrencyLogo currency={trade.outputAmount.currency} size={16} />
      <ThemedText.LabelSmall color="neutral1">
        {formatReviewSwapCurrencyAmount(trade.outputAmount)} {trade.outputAmount.currency.symbol}
      </ThemedText.LabelSmall>
    </Row>
  )
}
