import { PlatformSplitStubError } from 'utilities/src/errors'

export interface SliderProps {
  // Controlled value, clamped into [min, max] for rendering.
  value: number
  min: number
  max: number
  // Arrow-key increment. Pointer drag is CONTINUOUS (unsnapped) so a caller can floor/round the raw
  // value itself; `step` governs only keyboard nudges. Defaults to 1.
  step?: number
  onChange: (value: number) => void
  trackColor?: string
  activeColor?: string
  thumbColor?: string
  trackHeight?: number
  thumbSize?: number
  // Height of the hit/interaction area around the thin visual track.
  height?: number
  ariaLabel?: string
  ariaValueText?: string
  disabled?: boolean
}

// Cross-platform controlled slider. Web is the only real leg today (margin's leverage slider); the
// native leg throws until a native consumer needs it.
export function Slider(_props: SliderProps): JSX.Element {
  throw new PlatformSplitStubError('Slider')
}
