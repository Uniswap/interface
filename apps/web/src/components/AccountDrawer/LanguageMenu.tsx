import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn, MenuItem } from 'components/AccountDrawer/shared'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Trans } from 'i18n'
import { useUserLocaleManager } from 'state/user/hooks'

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const [, setUserLocale] = useUserLocaleManager()

  return (
    <MenuItem
      label={LOCALE_LABEL[locale]}
      onClick={() => {
        onClick?.()
        setUserLocale(locale)
      }}
      to={to}
      isActive={isActive}
      testId="wallet-language-item"
    />
  )
}

export function LanguageMenuItems() {
  const activeLocale = useActiveLocale()

  return (
    <>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} isActive={activeLocale === locale} key={locale} />
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
