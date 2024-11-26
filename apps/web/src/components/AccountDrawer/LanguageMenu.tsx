import { InterfaceEventName } from '@uniswap/analytics-events'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn, MenuItem } from 'components/AccountDrawer/shared'
import { useActiveLanguage } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { useDispatch } from 'react-redux'
import { Language, WEB_SUPPORTED_LANGUAGES } from 'uniswap/src/features/language/constants'
import { useLanguageInfo } from 'uniswap/src/features/language/hooks'
import { setCurrentLanguage } from 'uniswap/src/features/settings/slice'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trans } from 'uniswap/src/i18n'

function LanguageMenuItem({ language }: { language: Language }) {
  const currentLanguage = useActiveLanguage()
  const languageInfo = useLanguageInfo(language)
  const dispatch = useDispatch()

  const { to } = useLocationLinkProps(languageInfo.locale)

  return (
    <MenuItem
      label={languageInfo.displayName}
      onClick={() => {
        dispatch(setCurrentLanguage(language))
        sendAnalyticsEvent(InterfaceEventName.LANGUAGE_SELECTED, {
          previous_language: currentLanguage,
          new_language: language,
        })
      }}
      isActive={language === currentLanguage}
      to={to}
      testId="wallet-language-item"
    />
  )
}

export function LanguageMenuItems() {
  return (
    <>
      {WEB_SUPPORTED_LANGUAGES.map((language) => (
        <LanguageMenuItem language={language} key={language} />
      ))}
    </>
  )
}

export default function LanguageMenu({ onClose }: { onClose: () => void }) {
  return (
    <SlideOutMenu title={<Trans i18nKey="common.language" />} onClose={onClose}>
      <MenuColumn>
        <LanguageMenuItems />
      </MenuColumn>
    </SlideOutMenu>
  )
}
