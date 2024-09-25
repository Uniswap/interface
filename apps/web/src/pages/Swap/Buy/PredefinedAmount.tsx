import styled, { css } from 'lib/styled-components'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { fallbackCurrencyInfo } from 'pages/Swap/Buy/hooks'
import { formatFiatOnRampFiatAmount } from 'pages/Swap/Buy/shared'
import { useSporeColors } from 'ui/src'
import { Pill } from 'uniswap/src/components/pill/Pill'

interface PredefinedAmountProps {
  amount: number
  currentAmount: string
  disabled?: boolean
  onClick: () => void
}

export const ClickablePill = styled(Pill)<{ $disabled: boolean; $active: boolean }>`
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
  const { derivedBuyFormInfo } = useBuyFormContext()
  const { meldSupportedFiatCurrency } = derivedBuyFormInfo

  const active = currentAmount === amount.toString()
  return (
    <ClickablePill
      disabled={disabled}
      onPress={onClick}
      $disabled={disabled}
      $active={active}
      customBorderColor={colors.surface3.val}
      foregroundColor={colors[disabled ? 'neutral3' : active ? 'neutral1' : 'neutral2'].val}
      label={formatFiatOnRampFiatAmount(amount, meldSupportedFiatCurrency ?? fallbackCurrencyInfo)}
      px="$spacing16"
      textVariant="buttonLabel2"
    />
  )
}
