import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { type ComponentProps, PropsWithChildren, ReactNode } from 'react'
import { Flex, Text } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { breakpoints } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import CurrencyLogo from '~/components/Logo/CurrencyLogo'
import { MouseoverTooltip } from '~/components/Tooltip'

type ResponsiveHeadlineProps = PropsWithChildren<ComponentProps<typeof Text>>

const ResponsiveHeadline = ({ children, color, ...rest }: ResponsiveHeadlineProps) => {
  const { fullWidth: width } = useDeviceDimensions()
  const variant = width && width < breakpoints.xs ? 'heading3' : 'heading2'

  return (
    <Text variant={variant} color={color ?? '$neutral1'} {...rest}>
      {children}
    </Text>
  )
}

interface AmountProps {
  isLoading: boolean
  field: CurrencyField
  tooltipText?: ReactNode
  label: ReactNode
  amount: CurrencyAmount<Currency>
  usdAmount?: string
  headerTextProps?: ComponentProps<typeof Text>
  // The currency used here can be different than the currency denoted in the `amount` prop
  // (e.g., for some trade types or display preferences)
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
  const { formatCurrencyAmount, convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$gap12">
      <Flex gap="$spacing4">
        {label && (
          <Text variant="body2" color="$neutral2">
            <MouseoverTooltip text={tooltipText} disabled={!tooltipText}>
              <Text
                tag="span"
                variant="body3"
                color="$neutral2"
                mr="$spacing8"
                cursor={tooltipText ? 'help' : undefined}
              >
                {label}
              </Text>
            </MouseoverTooltip>
          </Text>
        )}
        <Flex gap="$spacing4">
          <ResponsiveHeadline
            data-testid={`${field}-amount`}
            color={isLoading ? '$neutral2' : '$neutral1'}
            {...headerTextProps}
          >
            {formatCurrencyAmount({
              value: amount,
              type: NumberType.TokenTx,
            })}{' '}
            {currency.symbol}
          </ResponsiveHeadline>
          <Text variant="body4" color="$neutral2">
            {convertFiatAmountFormatted(usdAmount, NumberType.FiatTokenQuantity)}
          </Text>
        </Flex>
      </Flex>
      <CurrencyLogo currency={currency} size={36} />
    </Flex>
  )
}
