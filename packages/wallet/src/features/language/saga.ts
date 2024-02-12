import { I18nManager } from 'react-native'
import RNRestart from 'react-native-restart'
import { Statsig } from 'statsig-react-native'
import { call, put, select, takeLatest } from 'typed-redux-saga'
import { getDeviceLocales } from 'utilities/src/device/locales'
import { logger } from 'utilities/src/logger/logger'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import {
  Language,
  Locale,
  SUPPORTED_LANGUAGES,
  mapDeviceLanguageToLanguage,
  mapLocaleToLanguage,
} from 'wallet/src/features/language/constants'
import { getLocale } from 'wallet/src/features/language/hooks'
import {
  selectCurrentLanguage,
  setCurrentLanguage,
  updateLanguage,
} from 'wallet/src/features/language/slice'
import i18n from 'wallet/src/i18n/i18n'

export function* appLanguageWatcherSaga() {
  yield* takeLatest(updateLanguage.type, appLanguageSaga)
}

function* appLanguageSaga(action: ReturnType<typeof updateLanguage>) {
  const featureEnabled = Statsig.checkGate(FEATURE_FLAGS.LanguageSelection)
  if (!featureEnabled) {
    return
  }

  const { payload: preferredLanguage } = action
  const currentAppLanguage = yield* select(selectCurrentLanguage)

  const languageToSet = !preferredLanguage ? yield* call(getDeviceLanguage) : preferredLanguage
  const localeToSet = getLocale(languageToSet)
  yield* put(setCurrentLanguage(languageToSet))

  if (currentAppLanguage === languageToSet && localeToSet === i18n.language) {
    return
  }

  try {
    yield* call([i18n, i18n.changeLanguage], localeToSet)
  } catch (error) {
    logger.warn(
      'language/saga',
      'appLanguageSaga',
      'Sync of language setting state and i18n instance failed'
    )
  }

  yield* call(restartAppIfRTL, localeToSet)
}

function getDeviceLanguage(): Language {
  // Gets the user device locales in order of their preference
  const deviceLocales = getDeviceLocales()

  for (const locale of deviceLocales) {
    // Normalizes language tags like 'zh-Hans-ch' to 'zh-Hans' that could happen on Android
    const normalizedLanguageTag = locale.languageTag.split('-').slice(0, 2).join('-') as Locale
    const mappedLanguageFromTag = Object.values(Locale).includes(normalizedLanguageTag)
      ? mapLocaleToLanguage[normalizedLanguageTag]
      : mapDeviceLanguageToLanguage[normalizedLanguageTag]
    const mappedLanguageFromCode = locale.languageCode as Maybe<Language>
    // Prefer languageTag as it's more specific, falls back to languageCode
    const mappedLanguage = mappedLanguageFromTag || mappedLanguageFromCode

    if (mappedLanguage && SUPPORTED_LANGUAGES.includes(mappedLanguage)) {
      return mappedLanguage
    }
  }

  // Default to English if no supported language is found
  return Language.English
}

function restartAppIfRTL(currentLocale: Locale) {
  const isRtl = i18n.dir(currentLocale) === 'rtl'
  if (isRtl !== I18nManager.isRTL) {
    logger.info(
      'saga.ts',
      'restartAppIfRTL',
      `Changing RTL to ${isRtl} for locale ${currentLocale}`
    )
    I18nManager.forceRTL(isRtl)

    // Need to restart to apply RTL changes
    // RNRestart requires timeout to work properly with reanimated
    setTimeout(() => {
      RNRestart.restart()
    }, 1000)
  }
}
