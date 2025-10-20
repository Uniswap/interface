import { NotificationContentProps } from 'uniswap/src/components/notifications/NotificationToastContent'
import { PlatformSplitStubError } from 'utilities/src/errors'

export interface NotificationToastProps
  extends Omit<NotificationContentProps, 'onNotificationPress' | 'onActionButtonPress'> {
  address?: string
  hideDelay?: number // If omitted, the default delay time is used
}

export function NotificationToast(_props: NotificationToastProps): JSX.Element {
  throw new PlatformSplitStubError('NotificationToast')
}
