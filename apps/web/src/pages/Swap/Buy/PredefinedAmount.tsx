import styled, { css } from 'styled-components'
import { useSporeColors } from 'ui/src'
import { Pill } from 'uniswap/src/components/pill/Pill'
import { NO_DECIMALS_CURRENCY, useFormatter } from 'utils/formatNumbers'

interface PredefinedAmountProps {
  amount: number
  currentAmount: string
  disabled?: boolean
  onClick: () => void
}

const ClickablePill = styled(Pill)<{ disabled: boolean }>`
  ${({ disabled }) =>
    !disabled &&
    css`
      cursor: pointer;
      &:hover {
        background-color: ${({ theme }) => theme.surface2};
        border-color: ${({ theme }) => theme.surface3};
      }
    `}
`

export function PredefinedAmount({ currentAmount, amount, disabled = false, onClick }: PredefinedAmountProps) {
  const colors = useSporeColors()
  const { formatFiatPrice } = useFormatter()

  const highlighted = currentAmount === amount.toString()
  return (
    <ClickablePill
      disabled={disabled}
      onPress={onClick}
      backgroundColor={!disabled && highlighted ? '$surface2' : '$surface1'}
      customBorderColor={disabled ? colors.surface2.val : colors.surface3.val}
      foregroundColor={colors[disabled ? 'neutral3' : highlighted ? 'neutral1' : 'neutral2'].val}
      label={formatFiatPrice({
        price: amount,
        type: [
          {
            upperBound: Number.MAX_SAFE_INTEGER,
            formatterOptions: { ...NO_DECIMALS_CURRENCY, useGrouping: false },
          },
        ],
      })}
      px="$spacing16"
      textVariant="buttonLabel3"
    />
  )
}
