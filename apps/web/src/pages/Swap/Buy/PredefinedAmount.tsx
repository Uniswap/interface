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

const ClickablePill = styled(Pill)<{ $disabled: boolean; $active: boolean }>`
  background-color: ${({ $disabled, $active, theme }) =>
    $disabled ? theme.surface2 : $active ? theme.surface3 : theme.surface1};
  user-select: none;
  ${({ $disabled, $active }) =>
    !$disabled &&
    css`
      cursor: pointer;
      &:hover {
        background-color: ${({ theme }) => ($active ? theme.surface3Hovered : theme.surface1Hovered)};
        border-color: ${({ theme }) => theme.surface3Hovered};
      }
    `}
`

export function PredefinedAmount({ currentAmount, amount, disabled = false, onClick }: PredefinedAmountProps) {
  const colors = useSporeColors()
  const { formatFiatPrice } = useFormatter()

  const active = currentAmount === amount.toString()
  return (
    <ClickablePill
      disabled={disabled}
      onPress={onClick}
      $disabled={disabled}
      $active={active}
      customBorderColor={colors.surface3.val}
      foregroundColor={colors[disabled ? 'neutral3' : active ? 'neutral1' : 'neutral2'].val}
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
