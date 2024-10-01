import { PlainImageProps } from 'ui/src/components/UniversalImage/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function PlainImage(_props: PlainImageProps): JSX.Element {
  throw new PlatformSplitStubError('PlainImage')
}
