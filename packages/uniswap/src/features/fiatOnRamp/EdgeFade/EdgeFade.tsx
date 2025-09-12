import { FlexProps } from 'ui/src'
import { PlatformSplitStubError } from 'utilities/src/errors'

export function EdgeFade(_props: { side: 'left' | 'right' } & FlexProps): JSX.Element {
  throw new PlatformSplitStubError('EdgeFade')
}
