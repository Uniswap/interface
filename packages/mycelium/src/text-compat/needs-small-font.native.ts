import { getDeviceLocales } from 'utilities/src/device/locales'

// CJK locales (Chinese/Japanese) keep the base font size; every other locale
// gets the +1px `adjustedSize` bump that makes React Native font rendering
// match web/Figma.
export const needsSmallFont = (): boolean => {
  const languageCode = getDeviceLocales()[0]?.languageCode
  return languageCode === 'zh' || languageCode === 'ja'
}
