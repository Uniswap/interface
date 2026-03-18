import i18n from 'i18next'
import { Locale } from 'uniswap/src/features/language/constants'
import { isWebApp } from 'utilities/src/platform'

let changingTo = ''
export async function changeLanguage(locale: Locale): Promise<void> {
  // prevent pageload race condition on web from multiple language changes
  if (isWebApp) {
    const maxAttempts = 3
    let currentAttempts = 0
    // while language change is locked, wait up to a max of 3 attempts
    while (changingTo && currentAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      currentAttempts++
    }
  }
  if (i18n.language === locale || locale === changingTo) {
    return
  }
  // since its async we need to "lock" while its changing
  changingTo = locale
  await i18n.changeLanguage(locale)
  i18n.emit('')
  changingTo = ''
}
