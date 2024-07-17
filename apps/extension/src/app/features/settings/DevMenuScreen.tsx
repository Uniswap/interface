import { useTranslation } from 'react-i18next'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import { Accordion, Flex, ScrollView } from 'ui/src'
import { Settings } from 'ui/src/components/icons'
import i18n from 'uniswap/src/i18n/i18n'
import { GatingOverrides } from 'wallet/src/components/gating/GatingOverrides'
import { Language, SUPPORTED_LANGUAGES } from 'wallet/src/features/language/constants'
import { getLanguageInfo, useCurrentLanguageInfo } from 'wallet/src/features/language/hooks'
import { setCurrentLanguage } from 'wallet/src/features/language/slice'
import { useAppDispatch } from 'wallet/src/state'

export function DevMenuScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  // Changing extension language requires changing system settings, so allowing for easy override here
  const currentLanguageInfo = useCurrentLanguageInfo()

  return (
    <ScrollView>
      <ScreenHeader title="Developer Settings" />
      <Flex gap="$spacing8">
        <SettingsItemWithDropdown
          Icon={Settings}
          items={SUPPORTED_LANGUAGES.map((language) => {
            return { value: language, label: getLanguageInfo(t, language).displayName }
          })}
          selected={currentLanguageInfo.displayName}
          title="Language Override"
          onSelect={async (value) => {
            const language = value as Language
            const languageInfo = getLanguageInfo(t, language)
            await i18n.changeLanguage(languageInfo.locale)
            dispatch(setCurrentLanguage(language))
          }}
        />
        <Accordion collapsible type="single">
          <GatingOverrides />
        </Accordion>
      </Flex>
    </ScrollView>
  )
}
