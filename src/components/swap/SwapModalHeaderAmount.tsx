import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const MAX_AMOUNT_STR_LENGTH = 9

export const Label = styled(ThemedText.BodySmall)<{ cursor?: string }>`
  cursor: ${({ cursor }) => cursor};
  color: ${({ theme }) => theme.textSecondary};
  margin-right: 8px;
`

const Value = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  text-align: end;
`

const AmountContainer = styled(Column)`
  align-items: flex-end;
`

interface AmountProps {
  field: 'input' | 'output'
  tooltipText?: ReactNode
  label: string
  amount: CurrencyAmount<Currency>
  usdAmount?: number
}

export function SwapModalHeaderAmount({ tooltipText, label, amount, usdAmount, field }: AmountProps) {
  let formattedAmount = formatCurrencyAmount(amount, NumberType.TokenTx)
  if (formattedAmount.length > MAX_AMOUNT_STR_LENGTH) {
    formattedAmount = formatCurrencyAmount(amount, NumberType.SwapTradeAmount)
  }

  return (
    <Row align="flex-start" justify="space-between" gap="md">
      <Row width="wrap-content">
        <ThemedText.BodySecondary>
          {tooltipText ? (
            <MouseoverTooltip text={tooltipText}>
              <Label cursor="help">{label}</Label>
            </MouseoverTooltip>
          ) : (
            <Label>{label}</Label>
          )}
        </ThemedText.BodySecondary>
      </Row>

      <AmountContainer>
        <Row gap="sm" width="wrap-content">
          <CurrencyLogo currency={amount.currency} size="28px" />
          <ThemedText.HeadlineMedium color="primary" data-testid={`${field}-amount`}>
            {formattedAmount} {amount.currency.symbol}
          </ThemedText.HeadlineMedium>
        </Row>
        {usdAmount && (
          <ThemedText.BodySmall>
            <Value>${usdAmount.toFixed(2)}</Value>
          </ThemedText.BodySmall>
        )}
      </AmountContainer>
    </Row>
  )
}
