import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { BUNDLE_ID } from 'utilities/src/environment/env.native'
import { isIOS } from 'utilities/src/platform'

export async function dismissInAppBrowser(): Promise<void> {
  await WebBrowser.dismissBrowser()
}

export async function openSettings(): Promise<void> {
  await Linking.openSettings()
}

export async function openNotificationSettings(): Promise<void> {
  if (isIOS) {
    await openSettings()
  } else {
    await Linking.sendIntent('android.settings.APP_NOTIFICATION_SETTINGS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: BUNDLE_ID },
    ])
  }
}

export async function openSecuritySettings(): Promise<void> {
  if (isIOS) {
    await openSettings()
  } else {
    await Linking.sendIntent('android.settings.SECURITY_SETTINGS')
  }
}
