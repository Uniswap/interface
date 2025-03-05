import { MobileState } from 'src/app/mobileReducer'

export const selectAllPushNotificationSettings = (
  state: MobileState,
): {
  generalUpdatesEnabled: boolean
  priceAlertsEnabled: boolean
} => {
  const { generalUpdatesEnabled, priceAlertsEnabled } = state.pushNotifications
  return { generalUpdatesEnabled, priceAlertsEnabled }
}
