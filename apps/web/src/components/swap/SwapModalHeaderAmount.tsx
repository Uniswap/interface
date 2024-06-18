import { Currency, CurrencyAmount } from '@taraswap/sdk-core'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useWindowSize } from 'hooks/screenSize'
import { PropsWithChildren, ReactNode } from 'react'
import { TextProps } from 'rebass'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { Field } from './constants'

const Label = styled(ThemedText.BodySmall)<{ cursor?: string }>`
  cursor: ${({ cursor }) => cursor};
  color: ${({ theme }) => theme.neutral2};
  margin-right: 8px;
`

const ResponsiveHeadline = ({ children, ...textProps }: PropsWithChildren<TextProps>) => {
  const { width } = useWindowSize()

  if (width && width < BREAKPOINTS.xs) {
    return <ThemedText.HeadlineMedium {...textProps}>{children}</ThemedText.HeadlineMedium>
  }

  return <ThemedText.HeadlineLarge {...textProps}>{children}</ThemedText.HeadlineLarge>
}

interface AmountProps {
  isLoading: boolean
  field: Field
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
            color={isLoading ? 'neutral2' : undefined}
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
