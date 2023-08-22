import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useWindowSize } from 'hooks/useWindowSize'
import { PropsWithChildren, ReactNode } from 'react'
import { TextProps } from 'rebass'
import { Field } from 'state/swap/actions'
import styled from 'styled-components'
import { BREAKPOINTS, ThemedText } from 'theme'
import { formatNumber, NumberType } from 'utils/formatNumbers'
import { formatReviewSwapCurrencyAmount } from 'utils/formatNumbers'

export const Label = styled(ThemedText.BodySmall)<{ cursor?: string }>`
  cursor: ${({ cursor }) => cursor};
  color: ${({ theme }) => theme.textSecondary};
  margin-right: 8px;
`

const ResponsiveHeadline = ({ children, ...textProps }: PropsWithChildren<TextProps>) => {
  const { width } = useWindowSize()

  if (width && width < BREAKPOINTS.xs) {
    return <ThemedText.HeadlineMedium {...textProps}>{children}</ThemedText.HeadlineMedium>
  }

  return (
    <ThemedText.HeadlineLarge fontWeight={500} {...textProps}>
      {children}
    </ThemedText.HeadlineLarge>
  )
}

interface AmountProps {
  field: Field
  tooltipText?: ReactNode
  label: ReactNode
  amount: CurrencyAmount<Currency>
  usdAmount?: number
  // The currency used here can be different than the currency denoted in the `amount` prop
  // For UniswapX ETH input trades, the trade object will have WETH as the amount.currency, but
  // the user's real input currency is ETH, so show ETH instead
  currency: Currency
}

export function SwapModalHeaderAmount({ tooltipText, label, amount, usdAmount, field, currency }: AmountProps) {
  return (
    <Row align="center" justify="space-between" gap="md">
      <Column gap="xs">
        <ThemedText.BodySecondary>
          <MouseoverTooltip text={tooltipText} disabled={!tooltipText}>
            <Label cursor="help">{label}</Label>
          </MouseoverTooltip>
        </ThemedText.BodySecondary>
        <Column gap="xs">
          <ResponsiveHeadline data-testid={`${field}-amount`}>
            {formatReviewSwapCurrencyAmount(amount)} {currency?.symbol}
          </ResponsiveHeadline>
          {usdAmount && (
            <ThemedText.BodySmall color="textTertiary">
              {formatNumber(usdAmount, NumberType.FiatTokenQuantity)}
            </ThemedText.BodySmall>
          )}
        </Column>
      </Column>
      <CurrencyLogo currency={currency} size="36px" />
    </Row>
  )
}
