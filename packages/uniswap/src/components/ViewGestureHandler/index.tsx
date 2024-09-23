import { PropsWithChildren } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

function ViewGestureHandler(_props: PropsWithChildren<unknown>): JSX.Element {
  throw new PlatformSplitStubError('ViewGestureHandler')
}

export default ViewGestureHandler
