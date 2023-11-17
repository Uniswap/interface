import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { ArrowRight } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const theme = useTheme()
  const { formatReviewSwapCurrencyAmount } = useFormatter()

  return (
    <Row gap="sm" justify="center" align="center">
      <CurrencyLogo currency={trade.inputAmount.currency} size="16px" />
      <ThemedText.LabelSmall color="neutral1">
        {formatReviewSwapCurrencyAmount(trade.inputAmount)} {trade.inputAmount.currency.symbol}
      </ThemedText.LabelSmall>
      <ArrowRight color={theme.neutral1} size="12px" />
      <CurrencyLogo currency={trade.outputAmount.currency} size="16px" />
      <ThemedText.LabelSmall color="neutral1">
        {formatReviewSwapCurrencyAmount(trade.outputAmount)} {trade.outputAmount.currency.symbol}
      </ThemedText.LabelSmall>
    </Row>
  )
}
