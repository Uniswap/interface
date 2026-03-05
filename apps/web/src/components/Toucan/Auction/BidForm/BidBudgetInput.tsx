import { CurrencyInputPanel } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { CurrencyField } from 'uniswap/src/types/currency'
import { BudgetFieldState } from '~/components/Toucan/Auction/hooks/useBidBudgetField'

interface BidBudgetInputProps {
  label: string
  field: BudgetFieldState
  disabled?: boolean
}

const CUSTOM_PANEL_STYLE = {
  backgroundColor: '$surface2',
  borderRadius: '$rounded20',
  paddingVertical: '$spacing12',
} as const

export function BidBudgetInput({ label, field, disabled }: BidBudgetInputProps): JSX.Element {
  const {
    currencyAmount,
    currencyBalance,
    currencyInfo,
    usdValue,
    value,
    isFiatMode,
    onChange,
    onSelectPreset,
    onToggleFiatMode,
  } = field

  return (
    <CurrencyInputPanel
      autoFocus={!disabled}
      currencyField={CurrencyField.INPUT}
      headerLabel={label}
      value={value}
      currencyAmount={currencyAmount ?? undefined}
      currencyBalance={currencyBalance ?? undefined}
      currencyInfo={currencyInfo}
      usdValue={usdValue}
      onSetExactAmount={onChange}
      onSetPresetValue={onSelectPreset}
      onToggleIsFiatMode={onToggleFiatMode}
      isFiatMode={isFiatMode}
      customPanelStyle={CUSTOM_PANEL_STYLE}
      fontSizeOptions={{ maxFontSize: 18, minFontSize: 12 }}
      fiatValueVariant="body4"
      inputRowPaddingVertical="$none"
      inputRowMinHeight={32}
      disabled={disabled}
      hidePresets={disabled}
    />
  )
}
