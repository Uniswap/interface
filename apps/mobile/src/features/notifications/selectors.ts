import { MobileState } from 'src/app/mobileReducer'

export const selectGeneralUpdatesEnabled = (state: MobileState): boolean =>
  state.pushNotifications.generalUpdatesEnabled
export const selectPriceAlertsEnabled = (state: MobileState): boolean => state.pushNotifications.priceAlertsEnabled

export const selectAllPushNotificationSettings = (
  state: MobileState,
): {
  generalUpdatesEnabled: boolean
  priceAlertsEnabled: boolean
} => {
  const { generalUpdatesEnabled, priceAlertsEnabled } = state.pushNotifications
  return { generalUpdatesEnabled, priceAlertsEnabled }
}
