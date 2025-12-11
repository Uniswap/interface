import Row from 'components/deprecated/Row'
import { css, deprecatedStyled } from 'lib/styled-components'
import { X } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ClickableStyle } from 'theme/components/styles'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

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
  border-right: 0px;
`

const Container = deprecatedStyled.button<{ $selected?: boolean; $disabled?: boolean; $highlighted: boolean }>`
  color: ${({ theme, $selected, $disabled, $highlighted }) => {
    if ($highlighted) {
      return theme.neutral1
    }
    if ($selected && !$disabled) {
      return theme.neutral1
    }
    return theme.neutral2
  }};
  padding: 2px 8px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme, $highlighted, $selected }) => {
    if ($highlighted || $selected) {
      return theme.surface3
    }
    return 'unset'
  }};
  ${({ $highlighted }) => ($highlighted ? highlightedBorderCss : containerBorderCss)};
  ${({ $disabled }) => !$disabled && ClickableStyle};
`

const HighlightedContainerXButton = deprecatedStyled.button`
  ${ClickableStyle}
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6px 6px 6px 4px;
  height: 28px;
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
  const { formatPercent } = useLocalizationContext()
  const sign = priceAdjustmentPercentage > 0 ? '+' : '-'
  return (
    <Container
      $selected={selected}
      $disabled={disabled}
      $highlighted={false}
      onClick={() => !disabled && onSelect(priceAdjustmentPercentage)}
    >
      {priceAdjustmentPercentage === 0 ? (
        <ThemedText.BodySecondary fontWeight={535} color="inherit">
          <Trans i18nKey="common.market.label" />
        </ThemedText.BodySecondary>
      ) : (
        <ThemedText.BodySecondary fontWeight={535} color="inherit">
          {sign}
          {formatPercent(Math.abs(priceAdjustmentPercentage))}
        </ThemedText.BodySecondary>
      )}
    </Container>
  )
}

/**
 * A button to reset the price to the market price (i.e. an adjustment of 0%)
 * When defined, this button displays customAdjustmentPercentage instead of "Market"
 */
export function LimitCustomMarketPriceButton({
  customAdjustmentPercentage,
  selected,
  disabled,
  onSelect,
}: Omit<LimitPriceButtonProps, 'priceAdjustmentPercentage'> & {
  customAdjustmentPercentage?: number
}) {
  const onSetAdjustmentPercentage = () => !disabled && onSelect(0)
  const { formatPercent } = useLocalizationContext()
  return (
    <Row width="unset" gap="1px">
      <Container
        $selected={selected}
        $disabled={disabled}
        $highlighted={customAdjustmentPercentage !== undefined}
        onClick={onSetAdjustmentPercentage}
      >
        {!customAdjustmentPercentage ? (
          <ThemedText.BodySecondary color="inherit" fontWeight={535}>
            <Trans i18nKey="common.market.label" />
          </ThemedText.BodySecondary>
        ) : (
          <ThemedText.BodySecondary color="inherit" fontWeight={535}>
            {customAdjustmentPercentage > 0 ? '+' : ''}
            {formatPercent(customAdjustmentPercentage)}
          </ThemedText.BodySecondary>
        )}
      </Container>
      {customAdjustmentPercentage && (
        <HighlightedContainerXButton onClick={onSetAdjustmentPercentage}>
          <X size={16} />
        </HighlightedContainerXButton>
      )}
    </Row>
  )
}
