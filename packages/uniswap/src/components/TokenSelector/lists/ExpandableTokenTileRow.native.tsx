import { ReactNode } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

type ExpandableTokenTileRowProps<T> = {
  tokens: T[]
  keyExtractor: (token: T) => string
  renderTile: (token: T) => ReactNode
  expanded?: boolean
  onExpand?: (tokens: T[]) => void
}

// Web-only component — native token-selector sections use HorizontalPillRow instead.
export function ExpandableTokenTileRow<T>(_props: ExpandableTokenTileRowProps<T>): JSX.Element {
  throw new PlatformSplitStubError('ExpandableTokenTileRow')
}
