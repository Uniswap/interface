import { Trans } from '@lingui/macro'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'

import { MenuColumn, MenuItem } from './shared'
import { SlideOutMenu } from './SlideOutMenu'

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)

  return (
    <MenuItem
      label={LOCALE_LABEL[locale]}
      onClick={onClick}
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
    <SlideOutMenu title={<Trans>Language</Trans>} onClose={onClose}>
      <MenuColumn>
        <LanguageMenuItems />
      </MenuColumn>
    </SlideOutMenu>
  )
}
