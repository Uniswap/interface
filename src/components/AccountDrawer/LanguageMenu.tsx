import { Trans } from '@lingui/macro'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Check } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, ThemedText } from 'theme'

import { SlideOutMenu } from './SlideOutMenu'

const InternalLinkMenuItem = styled(Link)`
  ${ClickableStyle}
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.neutral1};
`

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <ThemedText.BodySmall data-testid="wallet-language-item">{LOCALE_LABEL[locale]}</ThemedText.BodySmall>
      {isActive && <Check color={theme.accent1} opacity={1} size={20} />}
    </InternalLinkMenuItem>
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
      <LanguageMenuItems />
    </SlideOutMenu>
  )
}
