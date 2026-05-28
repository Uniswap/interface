import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'

const PRESET_MAX = 100
export const PRESET_PERCENTAGES: PresetPercentage[] = [25, 50, 75, 100]

export function isMaxPercentage(percentage: PresetPercentage): percentage is 100 | 'max' {
  return percentage === PRESET_MAX || percentage === 'max'
}
