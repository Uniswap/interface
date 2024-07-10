import { Linking } from 'react-native'

export async function openURL(url: string): Promise<void> {
  await Linking.openURL(url)
}

export async function canOpenURL(url: string): Promise<boolean> {
  return await Linking.canOpenURL(url)
}
