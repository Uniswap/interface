import {
  CustomPriceRangeBound,
  type CustomPriceRangePreset,
  type CustomPriceRangeValue,
} from '~/pages/Liquidity/CreateAuction/types'

export function formatSignedValue(value: number, formatFiniteValue: (value: number) => string): string {
  const formatted = formatFiniteValue(value)
  return value > 0 ? `+${formatted}` : formatted
}

export function formatPriceRangeBound(
  value: CustomPriceRangeValue,
  formatFiniteValue: (value: number) => string,
): string {
  if (value === CustomPriceRangeBound.NegativeInfinity) {
    return '–∞'
  }
  if (value === CustomPriceRangeBound.PositiveInfinity) {
    return '+∞'
  }
  return formatSignedValue(value, formatFiniteValue)
}

export function normalizeSignedInput(value: string): string {
  return value.replace(/%/g, '').replace(/−/g, '-').replace(/–/g, '-').trim()
}

export function formatPresetLabel(
  preset: CustomPriceRangePreset,
  formatFiniteValue: (value: number) => string,
): string {
  return `${formatPriceRangeBound(preset.minPercentFromClearing, formatFiniteValue)}%, ${formatPriceRangeBound(
    preset.maxPercentFromClearing,
    formatFiniteValue,
  )}%`
}
