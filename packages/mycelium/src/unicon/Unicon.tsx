import { PlatformSplitStubError } from '@universe/environment'
import type { ReactElement } from 'react'
import type { UniconProps } from './types'

export function Unicon(_props: UniconProps): ReactElement {
  throw new PlatformSplitStubError('Unicon')
}
