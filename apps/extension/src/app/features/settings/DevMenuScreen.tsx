import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import { Accordion, Flex, ScrollView } from 'ui/src'
import { Settings } from 'ui/src/components/icons'
import { Language, WALLET_SUPPORTED_LANGUAGES } from 'uniswap/src/features/language/constants'
import { getLanguageInfo, useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import i18n from 'uniswap/src/i18n'
import { GatingOverrides } from 'wallet/src/components/gating/GatingOverrides'

export function DevMenuScreen(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Changing extension language requires changing system settings, so allowing for easy override here
  const currentLanguageInfo = useCurrentLanguageInfo()

  return (
    <ScrollView>
      <ScreenHeader title="Developer Settings" />
      <Flex gap="$spacing8">
        <SettingsItemWithDropdown
          Icon={Settings}
          items={WALLET_SUPPORTED_LANGUAGES.map((language) => {
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
