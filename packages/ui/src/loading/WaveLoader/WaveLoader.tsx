import type { WaveLoaderVariant } from 'ui/src/loading/WaveLoader/shared'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type WaveLoaderProps = {
  height: number
  color?: string
  disabled?: boolean
  variant?: WaveLoaderVariant
}

export function WaveLoader(_props: WaveLoaderProps): JSX.Element {
  throw new PlatformSplitStubError('WaveLoader')
}
