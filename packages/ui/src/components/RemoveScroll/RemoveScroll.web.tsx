import { RemoveScroll as TamaguiRemoveScroll } from '@tamagui/remove-scroll'
import type { ReactNode } from 'react'
import { RemoveScroll as ReactRemoveScroll } from 'react-remove-scroll'
import type { RemoveScrollProps } from 'ui/src/components/RemoveScroll/RemoveScroll'
import { isMobileWeb } from 'utilities/src/platform'

/**
 * On mobile web we use @tamagui/remove-scroll, which only sets overflow:hidden
 * on <html>. This is compatible with portaled Tamagui Sheets/drawers —
 * react-remove-scroll's event-based blocking breaks them because React's
 * synthetic events propagate through portal boundaries while its DOM
 * contains() check misclassifies those events as "outside" the lock.
 *
 * On desktop we use react-remove-scroll for its event-based blocking, which
 * also prevents scroll on intermediate overflow:auto containers (e.g. tables
 * behind a ContextMenu). removeScrollBar is disabled to avoid injecting
 * overflow:hidden + position:relative on <body> which breaks sticky headers.
 */
export function RemoveScroll({ enabled = false, children }: RemoveScrollProps): ReactNode {
  if (!enabled) {
    return children
  }

  const RemoveScrollComponent = isMobileWeb ? TamaguiRemoveScroll : ReactRemoveScroll

  return <RemoveScrollComponent removeScrollBar={false}>{children}</RemoveScrollComponent>
}
