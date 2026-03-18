import { type InAppNotification } from '@universe/api'

/**
 * A reactive condition for state-driven notifications.
 *
 * Unlike polling-based TriggerCondition, ReactiveCondition uses push-based updates
 * via a subscribe mechanism. The data source subscribes to state changes and
 * immediately re-evaluates whether to show/hide the notification.
 *
 * This is ideal for conditions that:
 * - Need instant response to state changes (e.g., network status)
 * - Already have observable state (e.g., NetInfo, Redux store subscriptions)
 * - Should show/hide without polling delay
 *
 * @template TState - The shape of the state that drives the condition
 *
 * @example
 * ```typescript
 * const offlineCondition: ReactiveCondition<OfflineState> = {
 *   notificationId: 'local:session:offline',
 *   subscribe: (onStateChange) => {
 *     return NetInfo.addEventListener((state) => {
 *       onStateChange({ isConnected: state.isConnected })
 *     })
 *   },
 *   shouldShow: (state) => state.isConnected === false,
 *   createNotification: (state) => new Notification({ ... })
 * }
 * ```
 */
export interface ReactiveCondition<TState> {
  /**
   * Unique notification ID.
   * Must use 'local:' prefix to distinguish from backend-generated notifications.
   * Use 'local:session:' prefix for session-scoped notifications that reset on app restart.
   */
  notificationId: string

  /**
   * Subscribe to state changes.
   * @param onStateChange - Callback to invoke when state changes
   * @returns Unsubscribe function to stop receiving updates
   */
  subscribe: (onStateChange: (state: TState) => void) => () => void

  /**
   * Check if the notification should be shown based on current state.
   * @param state - The current state
   * @returns true if the notification should be visible
   */
  shouldShow: (state: TState) => boolean

  /**
   * Create the notification object to be rendered.
   * Called when shouldShow returns true.
   * @param state - The current state (may be useful for dynamic notification content)
   * @returns The notification to display
   */
  createNotification: (state: TState) => InAppNotification
}
