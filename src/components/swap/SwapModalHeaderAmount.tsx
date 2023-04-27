import { formatCurrencyAmount, NumberType } from '@uniswap/conedison/format'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import Tooltip from 'components/Tooltip'
import { ReactNode, useState } from 'react'
import { Info } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'

const MAX_AMOUNT_STR_LENGTH = 9

export const Label = styled.span`
  color: ${({ theme }) => theme.textSecondary};
  margin-right: 8px;
  max-width: 75%;
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
  const [showHoverTooltip, setShowHoverTooltip] = useState(false)
  const theme = useTheme()

  let formattedAmount = formatCurrencyAmount(amount, NumberType.TokenTx)
  if (formattedAmount.length > MAX_AMOUNT_STR_LENGTH) {
    formattedAmount = formatCurrencyAmount(amount, NumberType.SwapTradeAmount)
  }

  return (
    <Row align="flex-start" justify="space-between" gap="12px">
      <Row width="wrap-content">
        <ThemedText.BodySecondary>
          <Label>{label}</Label>
        </ThemedText.BodySecondary>
        {tooltipText && (
          <Info
            size={16}
            color={theme.textSecondary}
            onMouseEnter={() => setShowHoverTooltip(true)}
            onMouseLeave={() => setShowHoverTooltip(false)}
          />
        )}
        <Tooltip show={showHoverTooltip} placement="right" text={tooltipText} />
      </Row>

      <AmountContainer>
        <Row gap="0.5rem" width="wrap-content">
          <CurrencyLogo currency={amount.currency} size="28px" />
          <ThemedText.HeadlineMedium color="primary" data-testid={`${field}-amount`}>
            {formattedAmount} {amount.currency.symbol}
          </ThemedText.HeadlineMedium>
        </Row>
        {usdAmount && (
          <ThemedText.BodySecondary>
            <Value>${usdAmount.toFixed(2)}</Value>
          </ThemedText.BodySecondary>
        )}
      </AmountContainer>
    </Row>
  )
}
