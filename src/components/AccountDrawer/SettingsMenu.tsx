import { Trans } from '@lingui/macro'
import { LOCALE_LABEL, SUPPORTED_LOCALES, SupportedLocale } from 'constants/locales'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useLocationLinkProps } from 'hooks/useLocationLinkProps'
import { Check } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'
import { ClickableStyle, ThemedText } from 'theme'
import ThemeToggle from 'theme/components/ThemeToggle'

import { GitVersionRow } from './GitVersionRow'
import { SlideOutMenu } from './SlideOutMenu'
import { SmallBalanceToggle } from './SmallBalanceToggle'

const InternalLinkMenuItem = styled(Link)`
  ${ClickableStyle}
  flex: 1;
  color: ${({ theme }) => theme.textTertiary};
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 12px 0;
  justify-content: space-between;
  text-decoration: none;
  color: ${({ theme }) => theme.textPrimary};
`

function LanguageMenuItem({ locale, isActive }: { locale: SupportedLocale; isActive: boolean }) {
  const { to, onClick } = useLocationLinkProps(locale)
  const theme = useTheme()

  if (!to) return null

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <ThemedText.BodySmall data-testid="wallet-language-item">{LOCALE_LABEL[locale]}</ThemedText.BodySmall>
      {isActive && <Check color={theme.accentActive} opacity={1} size={20} />}
    </InternalLinkMenuItem>
  )
}

const SectionTitle = styled(ThemedText.SubHeader)`
  color: ${({ theme }) => theme.textSecondary};
  padding-bottom: 24px;
`

const ThemeToggleContainer = styled.div`
  margin: 0 0 6px;
`

const BalanceToggleContainer = styled.div`
  padding: 16px 0;
  margin-bottom: 26px;
`

export default function SettingsMenu({ onClose }: { onClose: () => void }) {
  const activeLocale = useActiveLocale()

  return (
    <SlideOutMenu title={<Trans>Settings</Trans>} onClose={onClose}>
      <SectionTitle>
        <Trans>Preferences</Trans>
      </SectionTitle>
      <ThemeToggleContainer>
        <ThemeToggle />
      </ThemeToggleContainer>
      <BalanceToggleContainer>
        <SmallBalanceToggle />
      </BalanceToggleContainer>

      <SectionTitle data-testid="wallet-header">
        <Trans>Language</Trans>
      </SectionTitle>
      {SUPPORTED_LOCALES.map((locale) => (
        <LanguageMenuItem locale={locale} isActive={activeLocale === locale} key={locale} />
      ))}
      <GitVersionRow />
    </SlideOutMenu>
  )
}
