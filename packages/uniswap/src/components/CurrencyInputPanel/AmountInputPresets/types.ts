export type PresetPercentageNumber = 25 | 50 | 75 | 100
export type PresetPercentage = PresetPercentageNumber | 'max'

export interface AmountInputPresetsProps<T> {
  hoverLtr?: boolean
  presets: T[]
  renderPreset: (preset: T) => JSX.Element
}
