// make React Native font rendering more visually similar to the web and Figma
// Except for CJK languages (only Chinese and Japanese for now)

import { getDeviceLocales } from 'utilities/src/device/locales'

export const needsSmallFont = (): boolean => {
  const languageCode = getDeviceLocales()[0]?.languageCode
  return languageCode === 'zh' || languageCode === 'ja'
}
