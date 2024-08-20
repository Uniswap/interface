import { InterfaceEventName } from '@uniswap/analytics-events'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn, MenuItem } from 'components/AccountDrawer/shared'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { useUserLocaleManager } from 'state/user/hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { Trans } from 'uniswap/src/i18n'

function LanguageMenuItem({ locale }: { locale: SupportedLocale }) {
  const activeLocale = useActiveLocale()

  const { to, onClick } = useLocationLinkProps(locale)
  const [, setUserLocale] = useUserLocaleManager()

  return (
    <MenuItem
      label={LOCALE_LABEL[locale]}
      onClick={() => {
        onClick?.()
        setUserLocale(locale)
        sendAnalyticsEvent(InterfaceEventName.LANGUAGE_SELECTED, {
          previous_language: activeLocale,
          new_language: locale,
        })
      }}
      to={to}
      isActive={locale === activeLocale}
      testId="wallet-language-item"
    />
  )
}

export function LanguageMenuItems() {
  return (
    <>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} key={locale} />
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
