import { ReactNode, RefObject } from 'react'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface RemoveScrollProps {
  enabled?: boolean
  children?: ReactNode
  /** Use event-based scroll blocking (react-remove-scroll) instead of CSS overflow:hidden. Needed for nested overflow:auto containers (e.g. tables behind context menus). Do NOT use with portaled content (Sheets, drawers) — the DOM contains() check misclassifies portal events as "outside" the lock. */
  blockScrollEvents?: boolean
  /** DOM refs whose subtrees should still be scrollable while the event-based lock is active (desktop web only). Only effective when blockScrollEvents is true. */
  // oxlint-disable-next-line typescript/no-explicit-any -- react-remove-scroll expects RefObject<any>
  shards?: Array<RefObject<any>>
}

export function RemoveScroll(_: RemoveScrollProps): ReactNode {
  throw new PlatformSplitStubError('RemoveScroll')
}
