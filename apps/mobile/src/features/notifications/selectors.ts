import { MobileState } from 'src/app/mobileReducer'

export const selectAllPushNotificationSettings = (
  state: MobileState,
): {
  generalUpdatesEnabled: boolean
} => {
  const { generalUpdatesEnabled } = state.pushNotifications
  return { generalUpdatesEnabled }
}
