import { PlatformSplitStubError } from 'utilities/src/errors'

export type OverKeyboardContentProps = {
  visible: boolean
}

export function OverKeyboardContent(_: React.PropsWithChildren<OverKeyboardContentProps>): JSX.Element {
  throw new PlatformSplitStubError('OverKeyboardContent')
}
