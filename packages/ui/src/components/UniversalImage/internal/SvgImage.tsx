import { SvgImageProps } from 'ui/src/components/UniversalImage/types'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function SvgImage(_props: SvgImageProps): JSX.Element | null {
  throw new PlatformSplitStubError('SvgImage')
}
