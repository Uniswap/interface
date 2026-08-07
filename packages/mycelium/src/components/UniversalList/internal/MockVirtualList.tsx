import { PlatformSplitStubError } from '@universe/environment'
import type { ReactElement } from 'react'
import type { UniversalListProps } from '../types'

export function MockVirtualList<T>(_props: UniversalListProps<T>): ReactElement {
  throw new PlatformSplitStubError('MockVirtualList')
}
