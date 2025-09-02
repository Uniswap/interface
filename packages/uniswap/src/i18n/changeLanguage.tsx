import i18n from 'i18next'
import { Locale } from 'uniswap/src/features/language/constants'
import { isInterface } from 'utilities/src/platform'

let changingTo = ''
export async function changeLanguage(locale: Locale): Promise<void> {
  console.log(`CLAUDE DEBUG: changeLanguage called with locale: ${locale}`)
  console.log(`CLAUDE DEBUG: Current i18n.language: ${i18n.language}`)
  console.log(`CLAUDE DEBUG: changingTo: ${changingTo}`)
  
  // prevent pageload race condition on web from multiple language changes
  if (isInterface) {
    const maxAttempts = 3
    let currentAttempts = 0
    // while language change is locked, wait up to a max of 3 attempts
    while (changingTo && currentAttempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      currentAttempts++
    }
  }
  if (i18n.language === locale || locale === changingTo) {
    console.log(`CLAUDE DEBUG: Skipping change - already at locale ${locale}`)
    return
  }
  // since its async we need to "lock" while its changing
  changingTo = locale
  console.log(`CLAUDE DEBUG: About to call i18n.changeLanguage(${locale})`)
  await i18n.changeLanguage(locale)
  console.log(`CLAUDE DEBUG: i18n.changeLanguage completed, new language: ${i18n.language}`)
  i18n.emit('')
  changingTo = ''
}
