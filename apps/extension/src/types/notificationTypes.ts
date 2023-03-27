/** Notifications */
export enum NotificationType {
  swapSubmitting = 'swapSubmitting',
  swapInProgress = 'swapInProgress',
  swapComplete = 'swapComplete',
  swapFailed = 'swapFailed',
  swapCancelled = 'swapCancelled',
  approvalPending = 'approvalPending',
  approvalComplete = 'approvalComplete',
  approvalFailed = 'approvalFailed',
}

export interface BaseNotification {
  type: NotificationType
}

export interface SwapNotification extends BaseNotification {
  swapInput: string
  swapOutput: string
  transactionHash?: string
}

export interface ApprovalNotification extends BaseNotification {
  transactionHash: string
}

export interface SwapSubmittingNotification extends SwapNotification {
  type: NotificationType.swapSubmitting
}
export interface SwapInProgressNotification extends SwapNotification {
  type: NotificationType.swapInProgress
}

export interface SwapCompleteNotification extends SwapNotification {
  type: NotificationType.swapComplete
}

export interface SwapFailedNotification extends SwapNotification {
  type: NotificationType.swapFailed
}

export interface SwapCancelledNotification extends SwapNotification {
  type: NotificationType.swapCancelled
}

export type Notification =
  | SwapCompleteNotification
  | SwapFailedNotification
  | SwapCancelledNotification
  | SwapSubmittingNotification
  | SwapInProgressNotification
