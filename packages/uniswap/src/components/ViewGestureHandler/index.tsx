import { PropsWithChildren } from 'react'
import { NotImplementedError } from 'utilities/src/errors'

function ViewGestureHandler(_props: PropsWithChildren<unknown>): JSX.Element {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export default ViewGestureHandler
