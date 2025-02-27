import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { PropsWithChildren, ReactNode } from 'react'
import { TextProps } from 'rebass'
import { ThemedText } from 'theme/components'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Label = styled(ThemedText.BodySmall)<{ cursor?: string }>`
  cursor: ${({ cursor }) => cursor};
  color: ${({ theme }) => theme.neutral2};
  margin-right: 8px;
`

const ResponsiveHeadline = ({ children, ...textProps }: PropsWithChildren<TextProps>) => {
  const { fullWidth: width } = useDeviceDimensions()

  if (width && width < breakpoints.xs) {
    return <ThemedText.HeadlineMedium {...textProps}>{children}</ThemedText.HeadlineMedium>
  }

  return <ThemedText.HeadlineLarge {...textProps}>{children}</ThemedText.HeadlineLarge>
}

interface AmountProps {
  isLoading: boolean
  field: CurrencyField
  tooltipText?: ReactNode
  label: ReactNode
  amount: CurrencyAmount<Currency>
  usdAmount?: number
  headerTextProps?: TextProps
  // The currency used here can be different than the currency denoted in the `amount` prop
  // For UniswapX ETH input trades, the trade object will have WETH as the amount.currency, but
  // the user's real input currency is ETH, so show ETH instead
  currency: Currency
}

export function SwapModalHeaderAmount({
  tooltipText,
  label,
  amount,
  usdAmount,
  field,
  currency,
  isLoading,
  headerTextProps,
}: AmountProps) {
  const { formatNumber, formatReviewSwapCurrencyAmount } = useFormatter()

  return (
    <Row align="center" justify="space-between" gap="md">
      <Column gap="xs">
        {label && (
          <ThemedText.BodySecondary>
            <MouseoverTooltip text={tooltipText} disabled={!tooltipText}>
              <Label cursor={tooltipText ? 'help' : undefined}>{label}</Label>
            </MouseoverTooltip>
          </ThemedText.BodySecondary>
        )}
        <Column gap="xs">
          <ResponsiveHeadline
            data-testid={`${field}-amount`}
            color={isLoading ? 'neutral2' : 'neutral1'}
            {...headerTextProps}
          >
            {formatReviewSwapCurrencyAmount(amount)} {currency?.symbol}
          </ResponsiveHeadline>
          <ThemedText.BodySmall color="neutral2">
            {formatNumber({
              input: usdAmount,
              type: NumberType.FiatTokenQuantity,
            })}
          </ThemedText.BodySmall>
        </Column>
      </Column>
      <CurrencyLogo currency={currency} size={36} />
    </Row>
  )
}
