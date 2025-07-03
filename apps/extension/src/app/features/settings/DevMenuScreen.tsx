import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsItemWithDropdown } from 'src/app/features/settings/SettingsItemWithDropdown'
import { Accordion, Flex, ScrollView, Text } from 'ui/src'
import { Settings } from 'ui/src/components/icons'
import { CacheConfig } from 'uniswap/src/components/gating/CacheConfig'
import { GatingOverrides } from 'uniswap/src/components/gating/GatingOverrides'
import { Language, WALLET_SUPPORTED_LANGUAGES } from 'uniswap/src/features/language/constants'
import { getLanguageInfo, useCurrentLanguageInfo } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import i18n from 'uniswap/src/i18n'

/**
 * When modifying this component, take into consideration that this is used
 * both as a full screen page in the Sidebar, and as a modal in the Onboarding page.
 */
export function DevMenuScreen(): JSX.Element {
  return (
    <ScrollView>
      <ScreenHeader title="Developer Settings" />

      <Flex gap="$spacing8">
        <Text variant="heading3" mt="$padding12">
          Gating
        </Text>
        <Accordion collapsible type="single">
          <GatingOverrides />
        </Accordion>

        <Text variant="heading3" mt="$padding12">
          Miscellaneous
        </Text>
        <LanguageOverride />
        <Accordion collapsible type="single">
          <CacheConfig />
        </Accordion>
      </Flex>
    </ScrollView>
  )
}

function LanguageOverride(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Changing extension language requires changing system settings, so allowing for easy override here
  const currentLanguageInfo = useCurrentLanguageInfo()

  return (
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
  )
}
