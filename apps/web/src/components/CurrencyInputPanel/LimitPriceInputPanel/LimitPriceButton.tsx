import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import Row from 'components/Row'
import { X } from 'react-feather'
import styled, { css } from 'styled-components'
import { ClickableStyle } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

interface LimitPriceButtonProps {
  priceAdjustmentPercentage: number
  disabled?: boolean
  selected?: boolean
  onSelect: (priceAdjustmentPercentage: number) => void
}

const containerBorderCss = css`
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.surface3};
`

const highlightedBorderCss = css`
  border-radius: 999px 0px 0px 999px;
  border-top: 1px solid ${({ theme }) => theme.surface3};
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  border-left: 1px solid ${({ theme }) => theme.surface3};
  border-right: 1px solid transparent;
`

const Container = styled.button<{ $selected?: boolean; $disabled?: boolean; $highlighted: boolean }>`
  background-color: ${({ theme, $highlighted }) => ($highlighted ? theme.surface3 : 'unset')};
  color: ${({ theme, $selected, $disabled, $highlighted }) =>
    $highlighted || ($selected && !$disabled) ? theme.neutral1 : theme.neutral2};
  padding: 2px 8px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme, $selected, $highlighted }) =>
    $selected || $highlighted ? theme.surface3 : 'transparent'};
  ${({ $highlighted }) => ($highlighted ? highlightedBorderCss : containerBorderCss)};
  ${({ $disabled }) => !$disabled && ClickableStyle};
`

const HighlightedContainerXButton = styled.button`
  ${ClickableStyle}
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6px 6px 6px 4px;
  height: 24px;
  border-radius: 0px 999px 999px 0px;
  border-top: 1px solid ${({ theme }) => theme.surface3};
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
  border-right: 1px solid ${({ theme }) => theme.surface3};
  border-left: 1px solid transparent;
`

export function LimitPresetPriceButton({
  priceAdjustmentPercentage,
  selected,
  disabled,
  onSelect,
}: LimitPriceButtonProps) {
  const { formatPercent } = useFormatter()
  return (
    <Container
      $selected={selected}
      $disabled={disabled}
      $highlighted={false}
      onClick={() => !disabled && onSelect(priceAdjustmentPercentage)}
    >
      {priceAdjustmentPercentage === 0 ? (
        <Trans>Current</Trans>
      ) : (
        <span>+{formatPercent(new Percent(priceAdjustmentPercentage, 100))}</span>
      )}
    </Container>
  )
}

/**
 * A button to reset the price to the market price (i.e. an adjustment of 0%)
 * When defined, this button displays customAdjustmentPercentage instead of "Current"
 */
export function LimitCustomMarketPriceButton({
  customAdjustmentPercentage,
  selected,
  disabled,
  onSelect,
}: Omit<LimitPriceButtonProps, 'priceAdjustmentPercentage'> & { customAdjustmentPercentage?: number }) {
  const onSetAdjustmentPercentage = () => !disabled && onSelect(0)
  const { formatPercent } = useFormatter()

  return (
    <Row width="unset" gap="1px">
      <Container
        $selected={selected}
        $disabled={disabled}
        $highlighted={customAdjustmentPercentage !== undefined}
        onClick={onSetAdjustmentPercentage}
      >
        {!customAdjustmentPercentage ? (
          <Trans>Current</Trans>
        ) : (
          <span>
            {customAdjustmentPercentage > 0 ? '+' : ''}
            {formatPercent(new Percent(customAdjustmentPercentage, 100))}
          </span>
        )}
      </Container>
      {customAdjustmentPercentage && (
        <HighlightedContainerXButton onClick={onSetAdjustmentPercentage}>
          <X size={12} />
        </HighlightedContainerXButton>
      )}
    </Row>
  )
}
