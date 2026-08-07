import { PlatformSplitStubError } from '@universe/environment'
import type { ReactElement } from 'react'
import type { UniversalListPropsWithRef } from '../types'

export function VirtualList<T>(_props: UniversalListPropsWithRef<T>): ReactElement {
  throw new PlatformSplitStubError('VirtualList')
}
