import { ReactElement } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

type HorizontalPillRowProps<T> = {
  data: T[]
  keyExtractor: (item: T) => string
  renderPill: (item: T) => ReactElement
}

// Native-only component — web token-selector sections use ExpandableTokenTileRow instead.
export function HorizontalPillRow<T>(_props: HorizontalPillRowProps<T>): JSX.Element {
  throw new PlatformSplitStubError('HorizontalPillRow')
}
