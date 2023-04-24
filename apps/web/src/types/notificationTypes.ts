/** Notifications */
export enum NotificationType {
  ApprovalComplete = 'approvalComplete',
  ApprovalFailed = 'approvalFailed',
  ApprovalPending = 'approvalPending',
  SwapCancelled = 'swapCancelled',
  SwapComplete = 'swapComplete',
  SwapFailed = 'swapFailed',
  SwapInProgress = 'swapInProgress',
  SwapSubmitting = 'swapSubmitting',
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
  type: NotificationType.SwapSubmitting
}
export interface SwapInProgressNotification extends SwapNotification {
  type: NotificationType.SwapInProgress
}

export interface SwapCompleteNotification extends SwapNotification {
  type: NotificationType.SwapComplete
}

export interface SwapFailedNotification extends SwapNotification {
  type: NotificationType.SwapFailed
}

export interface SwapCancelledNotification extends SwapNotification {
  type: NotificationType.SwapCancelled
}

export type Notification =
  | SwapCompleteNotification
  | SwapFailedNotification
  | SwapCancelledNotification
  | SwapSubmittingNotification
  | SwapInProgressNotification
