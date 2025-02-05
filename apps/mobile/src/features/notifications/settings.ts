import OneSignal from 'react-native-onesignal'

// Enum value represents tag name in OneSignal
export enum NotifSettingType {
  GeneralUpdates = 'settings_general_updates_enabled',
  PriceAlerts = 'settings_price_alerts_enabled',
}

export function handleNotifSettingToggled(type: NotifSettingType, enabled: boolean): void {
  OneSignal.sendTag(type, enabled ? 'true' : 'false')
}

export async function getNotifSetting(type: NotifSettingType): Promise<boolean> {
  return new Promise((resolve, _reject) => {
    OneSignal.getTags((tags) => resolve(tags?.[type] === 'true'))
  })
}
