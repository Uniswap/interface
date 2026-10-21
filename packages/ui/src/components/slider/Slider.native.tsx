import type { SliderProps } from 'ui/src/components/slider/Slider'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type { SliderProps } from 'ui/src/components/slider/Slider'

export function Slider(_props: SliderProps): JSX.Element {
  throw new PlatformSplitStubError('Slider')
}
