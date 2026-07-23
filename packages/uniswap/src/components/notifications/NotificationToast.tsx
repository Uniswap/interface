import { NotificationContentProps } from 'uniswap/src/components/notifications/NotificationToastContent'
import { PlatformSplitStubError } from 'utilities/src/errors'

export type NotificationToastContentOverrideControls = {
  cancelDismiss: () => void
  dismissLatest: () => void
}

export interface NotificationToastProps extends Omit<
  NotificationContentProps,
  'contentOverride' | 'onNotificationPress' | 'onActionButtonPress'
> {
  address?: string
  contentOverride?: JSX.Element | ((controls: NotificationToastContentOverrideControls) => JSX.Element)
  hideDelay?: number // If omitted, the default delay time is used
  onExplicitDismiss?: () => void
}

export function NotificationToast(_props: NotificationToastProps): JSX.Element {
  throw new PlatformSplitStubError('NotificationToast')
}
