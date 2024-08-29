import i18n from 'i18next'
import { SupportedLocale } from 'uniswap/src/i18n/locales'

let changingTo = ''
export async function changeLanguage(locale: SupportedLocale): Promise<void> {
  if (i18n.language === locale || locale === changingTo) {
    return
  }
  // since its async we need to "lock" while its changing
  changingTo = locale
  await i18n.changeLanguage(locale)
  i18n.emit('')
  changingTo = ''
}
