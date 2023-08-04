import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { ArrowRight } from 'react-feather'
import { InterfaceTrade } from 'state/routing/types'
import { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatReviewSwapCurrencyAmount } from 'utils/formatNumbers'

export function TradeSummary({ trade }: { trade: Pick<InterfaceTrade, 'inputAmount' | 'outputAmount'> }) {
  const theme = useTheme()
  return (
    <Row gap="sm" justify="center" align="center">
      <CurrencyLogo currency={trade.inputAmount.currency} size="16px" />
      <ThemedText.LabelSmall color="textPrimary">
        {formatReviewSwapCurrencyAmount(trade.inputAmount)} {trade.inputAmount.currency.symbol}
      </ThemedText.LabelSmall>
      <ArrowRight color={theme.textPrimary} size="12px" />
      <CurrencyLogo currency={trade.outputAmount.currency} size="16px" />
      <ThemedText.LabelSmall color="textPrimary">
        {formatReviewSwapCurrencyAmount(trade.outputAmount)} {trade.outputAmount.currency.symbol}
      </ThemedText.LabelSmall>
    </Row>
  )
}
