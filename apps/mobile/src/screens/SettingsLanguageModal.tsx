import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { SettingsListModal } from 'src/components/Settings/lists/SettingsListModal'
import { loadIntlPolyfillsForLocale } from 'src/polyfills/intl-delayed'
import { Language, mapLanguageToLocale, WALLET_SUPPORTED_LANGUAGES } from 'uniswap/src/features/language/constants'
import { getLanguageInfo, useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { changeLanguage } from 'uniswap/src/i18n'
import { useEvent } from 'utilities/src/react/hooks'

export function SettingsLanguageModal(): JSX.Element {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const selectedLanguage = useCurrentLanguage()

  const getLanguageTitle = useCallback(
    (language: Language) => {
      return getLanguageInfo(t, language).displayName
    },
    [t],
  )

  const onSelectLanguageOption = useEvent(async (language: Language) => {
    const locale = mapLanguageToLocale[language]
    // Load the Intl locale data before changing the language so number formatting
    // (e.g. decimal separators) is correct for the newly selected language.
    loadIntlPolyfillsForLocale(locale)
    await changeLanguage(locale)
    dispatch(setCurrentLanguage(language))
  })

  return (
    <SettingsListModal
      modalName={ModalName.LanguageSelector}
      title={t('settings.setting.language.title')}
      selectedItem={selectedLanguage}
      options={WALLET_SUPPORTED_LANGUAGES}
      getItemTitle={getLanguageTitle}
      onSelectItem={onSelectLanguageOption}
    />
  )
}
